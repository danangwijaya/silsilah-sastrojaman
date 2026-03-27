<template>
  <div class="tree-container bg-grey-2 dark:bg-dark" ref="containerRef" 
    @mousedown="startPan" @mousemove="pan" @mouseup="endPan" @mouseleave="endPan" @wheel.prevent="zoom"
    @touchstart="startTouch" @touchmove="moveTouch" @touchend="endTouch" @touchcancel="endTouch">
    
    <div class="tree-canvas" :style="{ transform: `translate(${panX}px, ${panY}px) scale(${scale})`, width: layout.bounds.w + 'px', height: layout.bounds.h + 'px' }">
      
      <!-- SVG Lines Layer -->
      <svg class="lines-layer" width="100%" height="100%">
        <path v-for="line in layout.lines.filter(l => l.type === 'child')" :key="line.id" :d="line.d" class="child-link" />
        
        <template v-for="line in layout.lines.filter(l => l.type === 'spouse')" :key="line.id">
          <line :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2" class="spouse-link" />
          <text :x="line.midX" :y="line.midY + 4" text-anchor="middle" font-size="12" class="spouse-heart">❤️</text>
        </template>
      </svg>

      <!-- HTML Nodes Layer -->
      <div v-for="pos in layout.positions" :key="pos.id" class="node-wrapper" :style="{ left: pos.x + 'px', top: pos.y + 'px', width: CARD_W + 'px', height: CARD_H + 'px' }">
        <MemberCard
          :nodeInfo="treeStore.treeData.infos[pos.id]"
          :hasSpouse="hasSpouse(pos.id)"
          :isAuthenticated="treeStore.isAuthenticated"
          @click="$emit('node-click', pos.id)"
          @edit="$emit('edit', pos.id)"
          @delete="$emit('delete', pos.id)"
          @add-child="$emit('add-child', pos.id)"
          @add-spouse="$emit('add-spouse', pos.id)"
          @manage-relations="$emit('manage-relations', pos.id)"
          @set-root="$emit('set-root', pos.id)"
        />
      </div>

    </div>
    
    <!-- Controls Overlay -->
    <div class="controls-overlay q-pa-sm q-gutter-sm" :class="$q.screen.lt.sm ? 'column controls-mobile' : 'row controls-desktop'">
      <q-btn round color="white" text-color="dark" icon="add" :size="$q.screen.lt.sm ? 'sm' : 'md'" @click="scale += 0.1" title="Zoom In" />
      <q-btn round color="white" text-color="dark" icon="remove" :size="$q.screen.lt.sm ? 'sm' : 'md'" @click="scale = Math.max(0.2, scale - 0.1)" title="Zoom Out" />
      <q-btn round color="white" text-color="dark" icon="home" :size="$q.screen.lt.sm ? 'sm' : 'md'" @click="resetView" title="Reset View" />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { calculateTreeLayout, CARD_W, CARD_H } from '../utils/treeLayout'
import MemberCard from './MemberCard.vue'
import { useTreeStore } from '../stores/treeStore'

const treeStore = useTreeStore()

const containerRef = ref(null)

const props = defineProps({
  rootId: String
})

defineEmits(['node-click', 'edit', 'delete', 'add-child', 'add-spouse', 'manage-relations', 'set-root'])

const layout = computed(() => {
  return calculateTreeLayout(treeStore.treeData, props.rootId)
})

function hasSpouse(nodeId) {
  const node = treeStore.treeData.nodes[nodeId]
  return node && node.relations.some(r => r.type === 'spouse')
}

// ---- Pan and Zoom State ----
const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
let isPanning = false
let startMouseX = 0, startMouseY = 0
let startPanX = 0, startPanY = 0

function startPan(e) {
  if (e.target.closest('.member-card') || e.target.closest('.q-btn')) return; // let buttons/cards handle clicks
  isPanning = true
  startMouseX = e.clientX
  startMouseY = e.clientY
  startPanX = panX.value
  startPanY = panY.value
  containerRef.value.style.cursor = 'grabbing'
}

function pan(e) {
  if (!isPanning) return
  panX.value = startPanX + (e.clientX - startMouseX)
  panY.value = startPanY + (e.clientY - startMouseY)
}

function endPan() {
  isPanning = false
  if (containerRef.value) containerRef.value.style.cursor = 'grab'
}

let initialPinchDistance = null
let initialScale = 1

function startTouch(e) {
  if (e.target.closest('.member-card') || e.target.closest('.q-btn')) return;
  if (e.touches.length === 1) {
    isPanning = true
    startMouseX = e.touches[0].clientX
    startMouseY = e.touches[0].clientY
    startPanX = panX.value
    startPanY = panY.value
  } else if (e.touches.length === 2) {
    isPanning = false
    initialPinchDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    initialScale = scale.value
  }
}

function moveTouch(e) {
  if (e.touches.length === 1 && isPanning) {
    panX.value = startPanX + (e.touches[0].clientX - startMouseX)
    panY.value = startPanY + (e.touches[0].clientY - startMouseY)
  } else if (e.touches.length === 2 && initialPinchDistance) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    scale.value = Math.max(0.1, Math.min(3, initialScale * (currentDistance / initialPinchDistance)))
  }
}

function endTouch() {
  isPanning = false
  initialPinchDistance = null
}

function zoom(e) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.max(0.1, Math.min(3, scale.value + delta))
}

function centerOnNode(nodeId) {
  const pos = layout.value.positions.find(p => p.id === nodeId)
  if (!pos || !containerRef.value) return
  const viewportW = containerRef.value.clientWidth
  panX.value = viewportW / 2 - (pos.x + CARD_W / 2) * scale.value
  panY.value = 50
}

let hasCentered = false
watch(() => [layout.value, containerRef.value], () => {
  if (hasCentered || !containerRef.value || layout.value.positions.length === 0) return
  setTimeout(() => { resetView(); hasCentered = true; }, 100)
}, { immediate: true, deep: true })

function resetView() {
  scale.value = $q.screen.lt.sm ? 0.6 : 1
  const mainNode = layout.value.positions.find(p => !p.isSpouse)
  if (mainNode) centerOnNode(mainNode.id)
}
</script>

<style scoped>
.tree-container {
  width: 100%;
  height: calc(100vh - 50px); /* Fill screen minus header */
  overflow: hidden;
  position: relative;
  cursor: grab;
  user-select: none;
  touch-action: none; /* Prevent mobile browser page scroll/pull-to-refresh while dragging */
}



body.body--dark .tree-container {
  background-color: var(--q-dark-page);
}

.tree-canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  transition: transform 0.05s linear;
}

.lines-layer {
  position: absolute;
  top: 0; left: 0;
  z-index: 0;
  pointer-events: none;
}

.child-link {
  fill: none;
  stroke: #90A4AE;
  stroke-width: 3.5;
  stroke-linecap: round;
  transition: stroke 0.3s ease;
}

body.body--dark .child-link {
  stroke: #455A64;
}

.spouse-link {
  stroke: #F06292;
  stroke-width: 2.5;
  stroke-dasharray: 6 6;
  stroke-linecap: round;
}

.spouse-heart {
  font-family: Arial, sans-serif; /* basic emoji fonts */
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(233, 30, 99, 0.5));
}

.node-wrapper {
  position: absolute;
  z-index: 10;
}

.controls-overlay {
  position: absolute;
  z-index: 100;
}

.controls-desktop {
  bottom: 20px;
  right: 20px;
}

.controls-mobile {
  top: 15px;
  right: 15px;
  border-radius: 12px;
}
</style>
