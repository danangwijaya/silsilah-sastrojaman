<template>
  <div class="member-card" :class="[genderClass, { absent: isAbsent }]" @click.stop="$emit('click')">
    <div class="card-bg" :style="photoUrl ? `background-image: url(${photoUrl})` : ''">
      <!-- Fallback empty avatar if no photoUrl -->
      <div v-if="!photoUrl" class="fallback-icon flex flex-center full-height full-width cursor-pointer text-white">
        <q-icon :name="nodeInfo?.gender === 'female' ? 'woman' : 'person'" size="100px" class="q-mb-xl" />
      </div>
    </div>
    
    <div class="card-overlay">
      <div class="info text-white">
        <div class="row items-center q-mb-xs">
          <div class="name text-h6 text-weight-bold ellipsis" :title="fullName">{{ fullName }}</div>
          <q-icon v-if="!isAbsent" name="verified" color="white" size="xs" class="q-ml-xs" />
        </div>
        
        <div class="subtitle text-caption text-weight-regular">
          <div v-if="nickname" class="q-mb-xs">
            <q-badge color="white" text-color="dark" class="font-medium">"{{ nickname }}"</q-badge>
          </div>
          <div class="ellipsis-2-lines" style="font-size: 12px; opacity: 0.9;">
            {{ statusText }}
          </div>
        </div>
      </div>

      <div class="bottom-bar row items-center justify-between q-mt-md">
        <div class="stats row items-center q-gutter-x-sm text-white op-80">
          <div v-if="ageNumber" class="flex items-center">
            <q-icon name="person_outline" size="xs" class="q-mr-xs" /> {{ ageNumber }}
          </div>
          <div class="flex items-center" v-if="hasSpouse">
            <q-icon name="favorite_border" size="xs" class="q-mr-xs" />
          </div>
        </div>
        
        <q-btn 
          class="info-btn text-weight-bold" 
          color="white" 
          text-color="dark" 
          label="Profile +" 
          rounded dense no-caps size="sm" 
          @click.stop="$emit('click')"
        />
      </div>
    </div>

    <!-- Modern Floating Toolbar -->
    <div class="hover-toolbar" v-if="isAuthenticated">
      <q-btn flat round dense color="white" size="sm" icon="edit" @click.stop="$emit('edit')">
        <q-tooltip class="bg-dark font-medium" anchor="center left" self="center right" :offset="[10, 10]">Edit</q-tooltip>
      </q-btn>
      <q-btn flat round dense color="red-3" size="sm" icon="delete" @click.stop="$emit('delete')">
        <q-tooltip class="bg-red-9 font-medium" anchor="center left" self="center right" :offset="[10, 10]">Hapus</q-tooltip>
      </q-btn>
      <q-btn v-if="!hasSpouse" flat round dense color="pink-3" size="sm" icon="favorite" @click.stop="$emit('add-spouse')">
        <q-tooltip class="bg-pink-9 font-medium" anchor="center left" self="center right" :offset="[10, 10]">Tambah Pasangan</q-tooltip>
      </q-btn>
      <q-btn flat round dense color="light-green-3" size="sm" icon="add" @click.stop="$emit('add-child')">
        <q-tooltip class="bg-light-green-9 font-medium" anchor="center left" self="center right" :offset="[10, 10]">Tambah Anak Baru</q-tooltip>
      </q-btn>
      <q-btn flat round dense color="indigo-3" size="sm" icon="link" @click.stop="$emit('manage-relations')">
        <q-tooltip class="bg-indigo-9 font-medium" anchor="center left" self="center right" :offset="[10, 10]">Atur / Mapping Ulang Relasi</q-tooltip>
      </q-btn>
      <q-btn flat round dense color="amber-4" size="sm" icon="account_tree" @click.stop="$emit('set-root')">
        <q-tooltip class="bg-amber-9 font-medium" anchor="center left" self="center right" :offset="[10, 10]">Jadikan Akar / Leluhur Utama</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  nodeInfo: Object,
  hasSpouse: Boolean,
  isAuthenticated: Boolean
})

defineEmits(['click', 'edit', 'delete', 'add-child', 'add-spouse', 'manage-relations', 'set-root'])

const fullName = computed(() => {
  if (!props.nodeInfo) return '?'
  let name = props.nodeInfo.firstName || ''
  if (props.nodeInfo.lastName && props.nodeInfo.lastName !== '.') name += ' ' + props.nodeInfo.lastName
  return name.trim() || '?'
})

const isAbsent = computed(() => !!props.nodeInfo?.isAbsent)
const genderClass = computed(() => props.nodeInfo?.firstName === '?' ? 'bg-unknown' : (props.nodeInfo?.gender === 'male' ? 'bg-male' : 'bg-female'))

const photoUrl = computed(() => props.nodeInfo?.photoUrl || null)

const nickname = computed(() => {
  if (!props.nodeInfo?.attributes) return null
  const attr = props.nodeInfo.attributes.find(a => a.type === 'nickname')
  return attr ? attr.value : null
})

const ageNumber = computed(() => {
  if (props.nodeInfo?.dob) {
    const dob = new Date(props.nodeInfo.dob)
    const now = new Date()
    let age = now.getFullYear() - dob.getFullYear()
    const m = now.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
    return age
  }
  return null
})

const statusText = computed(() => {
  if (isAbsent.value) return 'Almarhum/ah'
  if (props.nodeInfo?.firstName === '?') return 'Data tidak diketahui'
  if (props.nodeInfo?.address) return props.nodeInfo.address
  return '-'
})
</script>

<style scoped>
.member-card {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.member-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 16px 32px rgba(0,0,0,0.2);
  z-index: 100;
}

.card-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.card-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
}

.info {
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 16px;
  line-height: 1.2;
  letter-spacing: 0.2px;
  max-width: 85%;
}

.subtitle {
  opacity: 0.85;
  line-height: 1.3;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bottom-bar {
  margin-top: 12px;
}

.op-80 {
  opacity: 0.8;
  font-size: 13px;
  font-weight: 500;
}

.info-btn {
  padding: 2px 12px;
}

.absent {
  filter: grayscale(60%);
}

.font-medium {
  font-weight: 500;
}

/* Fallback icons styling */
.fallback-icon {
  opacity: 0.4;
}

/* Premium Gradients for Light/Dark Mode */
.bg-male { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.bg-female { background: linear-gradient(135deg, #ff758c, #ff7eb3); }
.bg-unknown { background: linear-gradient(135deg, #a1c4fd, #c2e9fb); }

body.body--dark .bg-male { background: linear-gradient(135deg, #1E88E5, #1565C0); }
body.body--dark .bg-female { background: linear-gradient(135deg, #D81B60, #AD1457); }
body.body--dark .bg-unknown { background: linear-gradient(135deg, #616161, #424242); }

/* Hover Toolbar styling */
.hover-toolbar {
  position: absolute;
  top: 10px; right: 10px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 20px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: translateX(150%);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 20;
}

.member-card:hover .hover-toolbar {
  transform: translateX(0);
}
</style>
