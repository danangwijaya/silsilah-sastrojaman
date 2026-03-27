<template>
  <q-dialog v-model="isOpen" position="standard">
    <q-card style="width: 100%; max-width: 440px; border-radius: 28px;" class="q-pb-md bg-white shadow-24">
      
      <!-- Close button -->
      <q-btn icon="close" flat round dense v-close-popup class="absolute-top-right q-pa-md z-top" color="grey-6" />
      
      <!-- Header Section -->
      <div class="column items-center q-pt-xl q-px-md">
        
        <!-- Avatar Complex -->
        <div class="avatar-container relative-position q-mb-md">
          <div class="avatar-bg" :class="member?.gender === 'female' ? 'bg-pink-1' : 'bg-indigo-1'"></div>
          
          <q-avatar size="140px" class="main-avatar">
            <q-img v-if="member?.photoUrl" :src="member.photoUrl" />
            <q-icon v-else :name="member?.gender === 'female' ? 'woman' : 'person'" size="80px" color="grey-5" class="bg-grey-2 full-width full-height" />
          </q-avatar>
          
          <!-- Age Badge mimicking the 93 score ring -->
          <div v-if="ageNumber !== null" class="age-badge shadow-2 bg-white text-dark text-weight-bold flex flex-center" title="Usia">
            {{ ageNumber }}
          </div>
        </div>

        <div class="text-h5 text-weight-bolder text-dark q-mt-sm">{{ fullName }}</div>
        
        <div class="text-subtitle1 text-grey-7 q-mt-xs text-center flex items-center justify-center">
          <span>{{ nickname ? `"${nickname}"` : 'Silsilah Sastrojaman' }}</span>
          <span v-if="member?.isAbsent" class="text-red-5 text-weight-medium q-ml-sm">• Almarhum/ah</span>
        </div>

        <!-- Action Buttons -->
        <div class="row q-gutter-lg q-mt-md q-mb-lg">
          <q-btn v-if="member?.phone" round outline size="18px" color="grey-4" text-color="grey-8" icon="phone" @click="copyPhone" />
          <q-btn v-if="member?.phone" round outline size="18px" color="grey-4" text-color="grey-8" icon="email" @click="openWhatsApp" />
          <q-btn round outline size="18px" color="grey-4" text-color="grey-8" icon="chat" />
        </div>
      </div>

      <!-- Details List / Table format like reference -->
      <q-card-section class="q-px-lg q-pt-none">
        <div class="details-box">
          
          <div class="detail-row">
            <div class="detail-label">Usia / Tgl Lahir</div>
            <div class="detail-value text-dark">{{ dobText || '-' }}</div>
          </div>
          <q-separator color="grey-3" />
          
          <div class="detail-row">
            <div class="detail-label">Jenis Kelamin</div>
            <div class="detail-value text-dark">{{ genderText }}</div>
          </div>
          <q-separator color="grey-3" />

          <div class="detail-row">
            <div class="detail-label">Alamat</div>
            <div class="detail-value text-dark">{{ member?.address || '-' }}</div>
          </div>
          <q-separator color="grey-3" v-if="occupation" />

          <div class="detail-row" v-if="occupation">
            <div class="detail-label">Pekerjaan</div>
            <div class="detail-value text-dark">{{ occupation }}</div>
          </div>
          <q-separator color="grey-3" />

          <div class="detail-row">
            <div class="detail-label">Status Hidup</div>
            <div class="detail-value text-weight-medium" :class="member?.isAbsent ? 'text-red' : 'text-dark'">
              {{ member?.isAbsent ? 'Meninggal Dunia' : 'Masih Hidup' }}
            </div>
          </div>

        </div>
      </q-card-section>

      <!-- Admin Actions (Super useful for mobile where hover fails) -->
      <q-card-section v-if="isAuthenticated" class="q-pt-none q-pb-md">
        <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm text-center">Kelola Anggota</div>
        <div class="row justify-center q-gutter-sm">
          <q-btn round color="blue-6" icon="edit" size="md" @click="handleAction('edit')" title="Edit Data" />
          <q-btn v-if="!hasSpouse" round color="pink-5" icon="favorite" size="md" @click="handleAction('add-spouse')" title="Tambah Pasangan" />
          <q-btn round color="light-green-6" icon="add" size="md" @click="handleAction('add-child')" title="Tambah Anak Baru" />
          <q-btn round color="indigo-5" icon="link" size="md" @click="handleAction('manage-relations')" title="Mapping Ulang Relasi" />
          <q-btn round color="amber-6" icon="account_tree" size="md" @click="handleAction('set-root')" title="Jadikan Leluhur Utama" />
          <q-btn round color="red-6" icon="delete" size="md" @click="handleAction('delete')" title="Hapus Anggota" />
        </div>
      </q-card-section>

      <!-- Audit Log -->
      <q-card-section class="q-pt-sm q-pb-xs">
        <div class="text-caption text-center text-grey-5" style="font-size: 11px;">
          <div v-if="member?.addedAt">
            Ditambahkan oleh <span class="text-weight-bold text-grey-7">{{ member.createdBy || 'Sistem Lama' }}</span> ({{ formatDate(member.addedAt) }})
          </div>
          <div v-if="member?.updatedAt && member?.updatedAt !== member?.addedAt" class="q-mt-xs">
            Diedit oleh <span class="text-weight-bold text-grey-7">{{ member.updatedBy || 'Sistem Lama' }}</span> ({{ formatDate(member.updatedAt) }})
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
const member = ref(null)

const emit = defineEmits(['edit', 'delete', 'add-child', 'add-spouse', 'manage-relations', 'set-root'])

const isAuthenticated = computed(() => treeStore.isAuthenticated)
const memberId = computed(() => member.value?.id)
const hasSpouse = computed(() => {
  if (!memberId.value) return false
  const node = treeStore.treeData.nodes[memberId.value]
  return node && node.relations.some(r => r.type === 'spouse')
})

function handleAction(actionType) {
  isOpen.value = false
  emit(actionType, memberId.value)
}

function openDialog(memberData) {
  member.value = memberData
  isOpen.value = true
}

defineExpose({ openDialog })

const fullName = computed(() => {
  if (!member.value) return '?'
  let name = member.value.firstName || ''
  if (member.value.lastName && member.value.lastName !== '.') name += ' ' + member.value.lastName
  return name.trim() || '?'
})

function getAttribute(type) {
  if (!member.value?.attributes) return null
  const attr = member.value.attributes.find(a => a.type === type)
  return attr ? attr.value : null
}

const nickname = computed(() => getAttribute('nickname'))
const occupation = computed(() => getAttribute('pekerjaan') || getAttribute('occupation'))

const ageNumber = computed(() => {
  if (!member.value?.dob) return null
  const dob = new Date(member.value.dob)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
})

const dobText = computed(() => {
  if (!member.value?.dob) return ''
  const dob = new Date(member.value.dob)
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return dob.toLocaleDateString('id-ID', options)
})

const genderText = computed(() => {
  if (member.value?.gender === 'male') return 'Laki-laki'
  if (member.value?.gender === 'female') return 'Perempuan'
  return '-'
})

function copyPhone() {
  if (!member.value?.phone) return
  navigator.clipboard.writeText(member.value.phone)
  $q.notify({ message: 'Nomor telepon disalin', color: 'positive', position: 'top', timeout: 1500 })
}

function openWhatsApp() {
  if (!member.value?.phone) return
  let phone = member.value.phone.replace(/\D/g, '')
  if (phone.startsWith('0')) phone = '62' + phone.substring(1)
  window.open(`https://wa.me/${phone}`, '_blank')
}

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.avatar-container {
  width: 170px;
  height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.avatar-bg {
  position: absolute;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
}

.main-avatar {
  border: 4px solid white;
  z-index: 1;
}

.age-badge {
  position: absolute;
  bottom: 0px;
  right: 15px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 5px solid #28CE93; /* The green ring from the reference */
  font-size: 18px;
  z-index: 2;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.details-box {
  border: 1px solid #EEEEEE;
  border-radius: 16px;
  padding: 8px 20px;
  background: #FCFCFC;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  font-size: 15px;
}

.detail-label {
  color: #888888;
  width: 45%;
  font-weight: 500;
}

.detail-value {
  width: 55%;
  word-wrap: break-word;
  font-weight: 500;
}

/* Fallback for dialog background */
body.body--dark .bg-white { background: #1D1D1D !important; }
body.body--dark .details-box { background: #2A2A2A; border-color: #424242; }
body.body--dark .text-dark { color: #FFFFFF !important; }
body.body--dark .age-badge { background: #1D1D1D !important; color: #FFFFFF !important; }
body.body--dark .main-avatar { border-color: #1D1D1D; }
</style>
