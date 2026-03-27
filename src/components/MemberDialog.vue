<template>
  <q-dialog v-model="isOpen" persistent @hide="onHide">
    <q-card style="width: 100%; max-width: 600px;">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ isEdit ? '✏️ Edit Anggota' : '➕ Tambah Anggota' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit="onSubmit" class="q-gutter-md">
          
          <div class="row q-gutter-x-sm">
            <q-input class="col" v-model="form.firstName" label="Nama Depan *" :rules="[val => !!val || 'Kewajiban']" />
            <q-input class="col" v-model="form.lastName" label="Nama Belakang" />
          </div>

          <q-select 
            v-model="form.gender" 
            :options="[{label:'Laki-laki', value:'male'}, {label:'Perempuan', value:'female'}]" 
            emit-value map-options 
            label="Jenis Kelamin *" 
            :rules="[val => !!val || 'Kewajiban']" 
          />
          
          <div class="row q-gutter-x-sm">
            <q-input class="col" v-model="form.dob" type="date" label="Tanggal Lahir" stack-label />
            <q-input class="col" v-model.number="form.childOrder" type="number" label="Anak Ke- (Opsional)" hint="Untuk urutan" />
          </div>
          
          <div class="row q-gutter-x-sm">
            <q-input class="col" v-model="form.phone" label="No Telepon" />
            <q-input class="col" v-model="form.nickname" label="Nama Panggilan" />
          </div>

          <!-- Alamat & Map Geocoding -->
          <div class="row q-gutter-x-sm items-center">
            <q-input class="col" v-model="form.address" label="Alamat / Tempat Tinggal" autogrow />
            <q-btn flat round color="primary" icon="location_on" title="Pilih Koordinat di Peta" @click="toggleMap" />
          </div>
          
          <div v-show="showMap" class="q-mt-sm bg-grey-2 q-pa-sm rounded-borders" :class="{ 'bg-dark': $q.dark.isActive }">
            <div class="text-caption text-weight-medium q-mb-sm">Pilih Titik Lokasi Spesifik:</div>
            
            <q-input v-model="searchMapQuery" dense outlined placeholder="Cari kota/daerah... (mis: Jakarta)" class="q-mb-sm bg-white" :class="{ 'text-dark': $q.dark.isActive }" @keyup.enter.prevent="searchLocation">
              <template v-slot:append>
                <q-btn icon="search" flat dense @click="searchLocation" :loading="isSearchingMap" color="dark" />
              </template>
            </q-input>
            
            <div id="member-map" class="map-container rounded-borders shadow-1"></div>
            
            <div v-if="form.lat && form.lng" class="text-caption text-grey-7 q-mt-xs">
              Koordinat: {{ form.lat.toFixed(5) }}, {{ form.lng.toFixed(5) }}
            </div>
            <div v-else class="text-caption text-grey-7 q-mt-xs">
              Klik di peta untuk menyematkan pin lokasi
            </div>
          </div>

          <!-- Upload Foto -->
          <div v-if="form.photoUrl && !imageUrlForCrop" class="row items-center q-mb-sm q-pa-sm bg-grey-3 rounded-borders" :class="{ 'bg-grey-9': $q.dark.isActive }">
            <q-avatar size="45px" class="q-mr-md shadow-2">
              <q-img :src="form.photoUrl" />
            </q-avatar>
            <div class="text-caption text-weight-medium">Foto Saat Ini</div>
            <q-space />
            <q-btn flat color="negative" icon="delete" label="Hapus Foto" size="sm" @click="form.photoUrl = ''" />
          </div>

          <q-file v-model="photoFile" label="Pilih Foto Profil (Baru/Ganti)" accept="image/*" clearable bottom-slots>
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
            <template v-slot:hint>Bisa disesuaikan ukurannya di bawah</template>
          </q-file>

          <div v-if="imageUrlForCrop" class="q-mt-sm q-mb-md">
            <div class="text-caption text-weight-medium q-mb-xs">Sesuaikan Area Wajah:</div>
            <cropper
              ref="cropperRef"
              class="cropper-container rounded-borders shadow-2"
              :src="imageUrlForCrop"
              :stencil-props="{ aspectRatio: 1 }"
            />
          </div>

          <q-checkbox v-model="form.isAbsent" label="✝ Tandai Almarhum/ah" color="negative" />
          
          <!-- Tombol Aksi -->
          <div class="row q-mt-md justify-end">
            <q-btn flat label="Batal" color="primary" v-close-popup />
            <q-btn type="submit" label="Simpan" color="primary" :loading="saving" class="q-ml-sm" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useTreeStore } from '../stores/treeStore'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl
});

const $q = useQuasar()
const treeStore = useTreeStore()

const isOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const photoFile = ref(null)
const imageUrlForCrop = ref(null)
const cropperRef = ref(null)

const defaultForm = { firstName: '', lastName: '', gender: null, dob: '', phone: '', nickname: '', isAbsent: false, photoUrl: '', address: '', lat: null, lng: null, childOrder: '' }
const form = ref({ ...defaultForm })

// MAP STATE
const showMap = ref(false)
const searchMapQuery = ref('')
const isSearchingMap = ref(false)
let map = null
let marker = null

function onHide() {
  if (map) {
    map.remove()
    map = null
    marker = null
  }
}

watch(photoFile, (file) => {
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageUrlForCrop.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else {
    imageUrlForCrop.value = null
  }
})

// This can be used later to auto-assign a relationship logic
const relationContext = ref(null) 

function toggleMap() {
  showMap.value = !showMap.value
  if (showMap.value) {
    nextTick(() => {
      initMap()
      setTimeout(() => { if (map) map.invalidateSize() }, 300)
    })
  }
}

function initMap() {
  if (map) return
  const initLat = form.value.lat || -2.5489
  const initLng = form.value.lng || 118.0149
  const initZoom = form.value.lat ? 13 : 4

  map = L.map('member-map').setView([initLat, initLng], initZoom)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map)

  if (form.value.lat && form.value.lng) {
    marker = L.marker([form.value.lat, form.value.lng]).addTo(map)
  }

  map.on('click', async (e) => {
    const { lat, lng } = e.latlng
    setMarker(lat, lng)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      if (data && data.display_name) {
        if (!form.value.address) form.value.address = data.display_name
      }
    } catch (err) {
      console.error(err)
    }
  })
}

function setMarker(lat, lng) {
  form.value.lat = lat
  form.value.lng = lng
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng]).addTo(map)
  }
}

async function searchLocation() {
  if (!searchMapQuery.value) return
  isSearchingMap.value = true
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchMapQuery.value)}`
    const res = await fetch(url)
    const data = await res.json()
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)
      map.setView([lat, lon], 13)
      setMarker(lat, lon)
      if (!form.value.address) form.value.address = data[0].display_name
    } else {
      $q.notify({ type: 'warning', message: 'Lokasi tidak ditemukan' })
    }
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Gagal mencari lokasi' })
  } finally {
    isSearchingMap.value = false
  }
}

function openDialog(id = null, context = null) {
  isOpen.value = true
  onHide() // reset map instance
  showMap.value = false
  searchMapQuery.value = ''
  
  photoFile.value = null
  imageUrlForCrop.value = null
  relationContext.value = context
  
  if (id && treeStore.treeData.infos[id]) {
    isEdit.value = true
    editId.value = id
    const info = treeStore.treeData.infos[id]
    
    // Parse dob if exists
    let dobValue = ''
    if (info.dob) {
      const d = new Date(info.dob)
      dobValue = d.toISOString().split('T')[0]
    }
    
    let nick = ''
    if (info.attributes) {
      const nattr = info.attributes.find(a => a.type === 'nickname')
      if (nattr) nick = nattr.value
    }
    
    form.value = {
      firstName: info.firstName || '',
      lastName: info.lastName && info.lastName !== '.' ? info.lastName : '',
      gender: info.gender,
      dob: dobValue,
      phone: info.phone || '',
      nickname: nick,
      isAbsent: !!info.isAbsent,
      photoUrl: info.photoUrl || '',
      address: info.address || '',
      lat: info.lat || null,
      lng: info.lng || null,
      childOrder: info.childOrder || ''
    }
  } else {
    isEdit.value = false
    editId.value = null
    form.value = { ...defaultForm }
  }
}

defineExpose({ openDialog })

async function onSubmit() {
  saving.value = true
  try {
    // 1. Get cropped photo as Base64 if selected
    let uploadedUrl = form.value.photoUrl
    if (imageUrlForCrop.value && cropperRef.value) {
      const { canvas } = cropperRef.value.getResult()
      if (canvas) {
        const MAX_SIZE = 300
        let w = canvas.width
        let h = canvas.height
        if (w > MAX_SIZE) {
          h *= MAX_SIZE / w
          w = MAX_SIZE
        }
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = w
        tempCanvas.height = h
        const ctx = tempCanvas.getContext('2d')
        ctx.drawImage(canvas, 0, 0, w, h)
        uploadedUrl = tempCanvas.toDataURL('image/jpeg', 0.8)
      }
    }

    // 2. Prepare payload
    const payload = {
      firstName: form.value.firstName,
      gender: form.value.gender,
      isAbsent: form.value.isAbsent,
      photoUrl: uploadedUrl
    }
    
    if (form.value.lastName) payload.lastName = form.value.lastName
    if (form.value.dob) payload.dob = form.value.dob
    if (form.value.phone) payload.phone = form.value.phone
    if (form.value.address) payload.address = form.value.address
    if (form.value.lat) payload.lat = form.value.lat
    if (form.value.lng) payload.lng = form.value.lng
    if (form.value.childOrder !== '' && form.value.childOrder !== null) payload.childOrder = form.value.childOrder
    
    if (form.value.nickname) {
      payload.attributes = [{
        id: Math.random().toString(36).substring(7),
        type: 'nickname',
        value: form.value.nickname,
        addedAt: new Date().toISOString()
      }]
    } else {
      payload.attributes = []
    }

    // 3. Save to Store
    let newId = null
    if (isEdit.value) {
      await treeStore.updateMember(editId.value, payload)
    } else {
      newId = await treeStore.addMember(payload)
      
      // Auto assign relationship if spawned
      if (relationContext.value && relationContext.value.relatedTo) {
         if (relationContext.value.type === 'child') {
             await treeStore.addRelation(relationContext.value.relatedTo, newId, 'child')
         } else if (relationContext.value.type === 'spouse') {
             await treeStore.addRelation(relationContext.value.relatedTo, newId, 'spouse')
         }
      }
    }
    
    isOpen.value = false

  } catch (error) {
    console.error("Error saving member", error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.cropper-container {
  height: 300px;
  width: 100%;
  background: #2e2e2e;
}

.map-container {
  height: 200px;
  width: 100%;
  z-index: 10;
}
</style>
