<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="width: 100%; max-width: 500px; border-radius: 16px;">
      <q-card-section class="row items-center q-pb-sm">
        <div class="text-h6">🔗 Atur / Mapping Ulang Relasi</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="q-mb-md text-subtitle1">
          Anggota Utama: <strong class="text-primary">{{ targetName }}</strong>
        </div>

        <q-separator />

        <!-- Existing Relations Section -->
        <div class="q-my-md">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Daftar Relasi Saat Ini:</div>
          
          <!-- Parents -->
          <div v-if="parents.length > 0" class="q-mb-sm">
            <div class="text-caption text-grey-7">Orang Tua</div>
            <div v-for="rel in parents" :key="rel.to" class="row items-center bg-grey-2 q-pa-sm rounded-borders q-mb-xs">
              <span class="col ellipsis">{{ getFullName(treeStore.treeData.infos[rel.to]) }}</span>
              <q-btn flat round dense color="negative" icon="delete" size="sm" @click="confirmRemove(rel.to, 'parent')" title="Putuskan Relasi" />
            </div>
          </div>
          
          <!-- Spouses -->
          <div v-if="spouses.length > 0" class="q-mb-sm">
            <div class="text-caption text-grey-7">Pasangan</div>
            <div v-for="rel in spouses" :key="rel.to" class="row items-center bg-grey-2 q-pa-sm rounded-borders q-mb-xs">
              <span class="col ellipsis">{{ getFullName(treeStore.treeData.infos[rel.to]) }}</span>
              <q-btn flat round dense color="negative" icon="delete" size="sm" @click="confirmRemove(rel.to, 'spouse')" title="Putuskan Relasi" />
            </div>
          </div>

          <!-- Children -->
          <div v-if="children.length > 0" class="q-mb-sm">
            <div class="text-caption text-grey-7">Anak-anak</div>
            <div v-for="rel in children" :key="rel.to" class="row items-center bg-grey-2 q-pa-sm rounded-borders q-mb-xs">
              <span class="col ellipsis">{{ getFullName(treeStore.treeData.infos[rel.to]) }}</span>
              <q-btn flat round dense color="negative" icon="delete" size="sm" @click="confirmRemove(rel.to, 'child')" title="Putuskan Relasi" />
            </div>
          </div>
          
           <div v-if="parents.length === 0 && spouses.length === 0 && children.length === 0" class="text-caption text-grey italic">
             Belum memiliki satupun relasi keluarga yang terikat.
           </div>
        </div>

        <q-separator />

        <!-- Add New Relation Section -->
        <div class="q-mt-md">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Tambah Mapping Baru:</div>
          <q-select
            v-model="relationType"
            :options="[
              { label: '👪 Sebagai Orang Tua', value: 'parent' },
              { label: '💑 Sebagai Pasangan', value: 'spouse' },
              { label: '👶 Sebagai Anak', value: 'child' }
            ]"
            emit-value map-options
            label="Pilih Tipe Tautan"
            class="q-mb-sm"
            dense outlined
          />

          <q-input v-model="searchQuery" placeholder="Cari nama anggota (cth: Budi)" dense outlined class="q-mb-sm">
            <template v-slot:prepend><q-icon name="search" /></template>
          </q-input>

          <q-scroll-area style="height: 180px;" class="bg-grey-1 rounded-borders q-pa-sm shadow-1" :class="$q.dark.isActive ? 'bg-dark text-white' : ''">
            <q-list separator dense>
               <q-item 
                v-for="member in filteredMembers" 
                :key="member.id" 
                clickable 
                v-ripple 
                :active="selectedMemberId === member.id"
                active-class="bg-blue-1 text-primary text-weight-bold"
                @click="selectedMemberId = member.id"
              >
                <q-item-section avatar>
                  <q-avatar size="sm" :color="member.gender === 'male' ? 'blue' : 'pink'" text-color="white">
                     {{ member.gender === 'male' ? 'L' : 'P' }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ getFullName(member) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="filteredMembers.length === 0">
                <q-item-section class="text-grey text-center text-caption">Tidak ada anggota yang cocok dengan pencarian.</q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
          
          <div class="row q-mt-md justify-end">
            <q-btn label="Tautkan Relasi" color="primary" @click="submitRelation" :disable="!selectedMemberId || !relationType" />
          </div>
        </div>

      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useTreeStore } from '../stores/treeStore'

const $q = useQuasar()
const treeStore = useTreeStore()

const isOpen = ref(false)
const targetId = ref(null)
const relationType = ref('parent')
const searchQuery = ref('')
const selectedMemberId = ref(null)

const targetName = computed(() => {
  if (!targetId.value || !treeStore.treeData.infos[targetId.value]) return ''
  return getFullName(treeStore.treeData.infos[targetId.value])
})

const parents = computed(() => {
  if (!targetId.value || !treeStore.treeData.nodes[targetId.value]) return []
  return treeStore.treeData.nodes[targetId.value].relations.filter(r => r.type === 'parent')
})

const spouses = computed(() => {
  if (!targetId.value || !treeStore.treeData.nodes[targetId.value]) return []
  return treeStore.treeData.nodes[targetId.value].relations.filter(r => r.type === 'spouse')
})

const children = computed(() => {
  if (!targetId.value || !treeStore.treeData.nodes[targetId.value]) return []
  return treeStore.treeData.nodes[targetId.value].relations.filter(r => r.type === 'child')
})

const filteredMembers = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return Object.entries(treeStore.treeData.infos)
    .filter(([id, info]) => {
      if (id === targetId.value) return false // jangan tampilkan diri sendiri
      const name = getFullName(info).toLowerCase()
      return name.includes(q)
    })
    .map(([id, info]) => ({ id, ...info }))
})

function getFullName(info) {
  if (!info) return 'Unknown'
  let name = info.firstName || ''
  if (info.lastName && info.lastName !== '.') name += ' ' + info.lastName
  return name.trim() || '?'
}

function openDialog(defaultType, tId) {
  isOpen.value = true
  targetId.value = tId
  relationType.value = defaultType || 'parent'
  searchQuery.value = ''
  selectedMemberId.value = null
}

defineExpose({ openDialog })

function confirmRemove(relId, type) {
  const relName = getFullName(treeStore.treeData.infos[relId])
  $q.dialog({
    title: 'Putuskan Relasi?',
    message: `Benar ingin memutus ikatan keluarga dengan <strong>${relName}</strong>?`,
    html: true,
    cancel: true,
    color: 'negative'
  }).onOk(async () => {
    const success = await treeStore.removeRelation(targetId.value, relId, type)
    if (success) {
      $q.notify({ type: 'positive', message: 'Relasi berhasil diputus!' })
    }
  })
}

async function submitRelation() {
  if (!targetId.value || !selectedMemberId.value || !relationType.value) return
  
  const success = await treeStore.addRelation(targetId.value, selectedMemberId.value, relationType.value)
  if (success) {
    $q.notify({ type: 'positive', message: 'Anggota keluarga berhasil tertaut!' })
    selectedMemberId.value = null
    searchQuery.value = ''
  } else {
    $q.notify({ type: 'warning', message: 'Anggota tersebut sudah terdaftar di relasi ini.' })
  }
}
</script>
