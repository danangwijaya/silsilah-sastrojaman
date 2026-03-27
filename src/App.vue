<template>
  <q-layout view="hHh lpR fFf" :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-2'">
    <!-- Floating Glass Header -->
    <q-header class="glass-header text-white" :class="$q.dark.isActive ? 'glass-dark' : 'glass-light'">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold text-center q-py-sm" :class="$q.screen.lt.sm ? 'text-subtitle1' : 'text-h6'">
          Silsilah Keluarga Sastrojaman
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div v-if="treeStore.loading" class="flex flex-center full-height">
        <q-spinner color="primary" size="3em" />
      </div>
      <div v-else-if="Object.keys(treeStore.treeData.infos).length === 0" class="flex flex-center full-height column">
        <div class="text-h6 text-grey">Belum ada anggota keluarga</div>
        <q-btn v-if="treeStore.isAuthenticated" color="primary" icon="add" label="Tambah Anggota Pertama" class="q-mt-md" @click="memberDialogRef.openDialog()" />
      </div>
      
      <!-- Interactive Diagram Area -->
      <TreeDiagram 
        v-else 
        :rootId="treeStore.rootId" 
        :id="'printable-tree'"
        @node-click="showInfo"
        @edit="editMember"
        @delete="deleteMember"
        @add-child="addChild"
        @add-spouse="addSpouse"
        @manage-relations="manageRelations"
        @set-root="setRoot"
      />

      <!-- Floating App Tools (Bottom Center Dock) -->
      <q-page-sticky position="bottom" :offset="[0, 24]">
        <div class="glass-panel row items-center q-gutter-x-xs q-pa-xs shadow-6" :class="$q.dark.isActive ? 'bg-indigo-10 text-white' : 'bg-white text-dark'">
          <q-btn v-if="treeStore.isAuthenticated" flat round :dense="$q.screen.lt.sm" :size="$q.screen.lt.sm ? 'sm' : 'md'" icon="person_add" color="primary" @click="memberDialogRef.openDialog()">
            <q-tooltip>Tambah Akar Baru</q-tooltip>
          </q-btn>
          
          <q-btn flat round :dense="$q.screen.lt.sm" :size="$q.screen.lt.sm ? 'sm' : 'md'" icon="download" color="teal" @click="exportPdf" :loading="exporting">
            <q-tooltip>Export PDF</q-tooltip>
          </q-btn>
          
          <q-btn flat round :dense="$q.screen.lt.sm" :size="$q.screen.lt.sm ? 'sm' : 'md'" :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" :color="$q.dark.isActive ? 'warning' : 'grey-8'" @click="$q.dark.toggle()">
            <q-tooltip>Toggle Tema</q-tooltip>
          </q-btn>
          
          <q-separator vertical :dark="$q.dark.isActive" class="q-mx-xs" />

          <template v-if="treeStore.user">
            <q-avatar :size="$q.screen.lt.sm ? '26px' : '28px'" class="q-ml-sm q-mr-xs">
              <img :src="treeStore.user.photoURL || 'https://cdn.quasar.dev/logo-v2/svg/logo.svg'" />
            </q-avatar>
            <q-btn flat round :dense="$q.screen.lt.sm" :size="$q.screen.lt.sm ? 'sm' : 'md'" icon="logout" @click="treeStore.logout()" color="negative">
              <q-tooltip>Logout</q-tooltip>
            </q-btn>
          </template>
          
          <q-btn v-else flat round :dense="$q.screen.lt.sm" :size="$q.screen.lt.sm ? 'sm' : 'md'" icon="login" @click="treeStore.loginWithGoogle()" color="primary">
            <q-tooltip>Login Admin</q-tooltip>
          </q-btn>
          
          <q-btn v-if="treeStore.isAuthenticated" flat round :dense="$q.screen.lt.sm" :size="$q.screen.lt.sm ? 'sm' : 'md'" color="orange" icon="upload" @click="importJsonData">
            <q-tooltip>Import Data</q-tooltip>
          </q-btn>
        </div>
      </q-page-sticky>

    </q-page-container>

    <!-- Dialogs -->
    <MemberDialog ref="memberDialogRef" />
    <RelationDialog ref="relationDialogRef" />
    <MemberInfoDialog 
      ref="infoDialogRef"
      @edit="editMember"
      @delete="deleteMember"
      @add-child="addChild"
      @add-spouse="addSpouse"
      @manage-relations="manageRelations"
      @set-root="setRoot"
    />
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTreeStore } from './stores/treeStore'
import TreeDiagram from './components/TreeDiagram.vue'
import MemberDialog from './components/MemberDialog.vue'
import RelationDialog from './components/RelationDialog.vue'
import MemberInfoDialog from './components/MemberInfoDialog.vue'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import rawTreeData from './assets/tree.json'

const $q = useQuasar()
const treeStore = useTreeStore()

const memberDialogRef = ref(null)
const relationDialogRef = ref(null)
const infoDialogRef = ref(null)

const exporting = ref(false)

onMounted(async () => {
  treeStore.initAuth()
  await treeStore.loadData()
  
  // init theme
  if (localStorage.getItem('silsilah_theme') === 'dark') {
    $q.dark.set(true)
  }
})

// === Event Handlers ===
function showInfo(id) {
  const member = treeStore.treeData.infos[id]
  if (member && infoDialogRef.value) {
    infoDialogRef.value.openDialog({ id, ...member })
  }
}

function editMember(id) {
  memberDialogRef.value.openDialog(id)
}

function deleteMember(id) {
  $q.dialog({
    title: 'Hapus Anggota',
    message: 'Anda yakin ingin menghapus catatan silsilah ini?',
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    await treeStore.deleteMember(id)
    $q.notify({ type: 'info', message: 'Berhasil dihapus' })
  })
}

function addChild(parentId) {
  memberDialogRef.value.openDialog(null, { type: 'child', relatedTo: parentId })
}

function addSpouse(partnerId) {
  memberDialogRef.value.openDialog(null, { type: 'spouse', relatedTo: partnerId })
}

function manageRelations(id) {
  relationDialogRef.value.openDialog(null, id)
}

function setRoot(id) {
  treeStore.setRootId(id)
  $q.notify({ type: 'positive', message: 'Leluhur Utama berhasil diubah!' })
}

// === Export PDF ===
async function exportPdf() {
  exporting.value = true
  try {
    const el = document.querySelector('.tree-canvas')
    if (!el) return

    // Temukan ukuran asli elemen
    const w = el.offsetWidth
    const h = el.offsetHeight

    const canvas = await html2canvas(el, {
      scale: 2, // High res
      useCORS: true,
      backgroundColor: $q.dark.isActive ? '#1d1d1d' : '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    
    // Auto orientasi page (Landscape/Portrait)
    const orientation = w > h ? 'l' : 'p'
    const pdf = new jsPDF(orientation, 'pt', [w, h])
    
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)
    pdf.save(`Silsilah_Suminah_${new Date().toISOString().slice(0,10)}.pdf`)
    $q.notify({ type: 'positive', message: 'PDF berhasil disimpan!' })

  } catch (e) {
    console.error(e)
    $q.notify({ type: 'negative', message: 'Gagal mengekspor PDF' })
  } finally {
    exporting.value = false
  }
}

async function importJsonData() {
  if (confirm('YAKIN mem-replace seluruh database saat ini dengan data dari tree.json?')) {
    try {
      treeStore.treeData.nodes = rawTreeData.nodes || {}
      treeStore.treeData.infos = rawTreeData.infos || {}
      
      const userEmail = treeStore.user?.email || 'Anonim'
      for (const infoId in treeStore.treeData.infos) {
        if (!treeStore.treeData.infos[infoId].createdBy) {
          treeStore.treeData.infos[infoId].createdBy = userEmail
          treeStore.treeData.infos[infoId].updatedBy = userEmail
        }
      }
      
      await treeStore.saveData()
      $q.notify({ type: 'positive', message: 'Data tree.json berhasil di-upload ke database!' })
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Gagal upload: ' + e.message })
    }
  }
}
</script>

<style>
.full-height {
  height: calc(100vh - 50px);
}
.glass-header {
  width: auto;
  margin: 8px;
  border-radius: 16px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 2000;
  transition: background 0.3s, box-shadow 0.3s, border 0.3s;
}

@media (min-width: 600px) {
  .glass-header {
    margin: 16px 20px;
  }
}

.glass-light {
  background: rgba(25, 118, 210, 0.85); /* Quasar primary but translucent */
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
.glass-dark {
  background: rgba(30, 30, 30, 0.7);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.glass-panel {
  border-radius: 24px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
body.body--dark .glass-panel {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(40, 44, 52, 0.8) !important;
}
</style>
