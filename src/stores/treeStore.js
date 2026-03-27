import { defineStore } from 'pinia'
import { db, auth } from '../boot/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'

const COLLECTION = 'family_trees'
const DOC_ID = 'silsilah_suminah'

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

export const useTreeStore = defineStore('tree', {
  state: () => ({
    treeData: {
      nodes: {},
      infos: {}
    },
    rootId: localStorage.getItem('silsilah_root_id') || null,
    loading: false,
    user: null,
    authInitialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user
  },

  actions: {
    initAuth() {
      onAuthStateChanged(auth, (user) => {
        this.user = user
        this.authInitialized = true
      })
    },

    async loginWithGoogle() {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    },

    async logout() {
      await signOut(auth)
    },

    async loadData() {
      this.loading = true
      try {
        const docRef = doc(db, COLLECTION, DOC_ID)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          this.treeData = docSnap.data()
          
          if (!this.rootId) {
            const defaultRoot = Object.entries(this.treeData.infos).find(([id, info]) => {
              const name = ((info.firstName || '') + ' ' + (info.lastName || '')).toLowerCase()
              return name.includes('sastrojaman') || name.includes('sastrojahman')
            })
            if (defaultRoot) {
              this.setRootId(defaultRoot[0])
            }
          }
        } else {
          // Empty starting state
          this.treeData = { nodes: {}, infos: {} }
        }
      } catch (e) {
        console.error("Error loading data:", e)
      } finally {
        this.loading = false
      }
    },

    async saveData() {
      this.treeData.updatedAt = new Date().toISOString()
      try {
        await setDoc(doc(db, COLLECTION, DOC_ID), this.treeData)
      } catch (e) {
        console.error("Error saving data:", e)
      }
    },

    async addMember(info) {
      const id = generateId()
      const now = new Date().toISOString()
      const userEmail = this.user?.email || 'Anonim'
      this.treeData.infos[id] = { ...info, addedAt: now, updatedAt: now, createdBy: userEmail, updatedBy: userEmail }
      this.treeData.nodes[id] = { id, infoId: id, relations: [] }
      await this.saveData()
      return id
    },

    async updateMember(id, info) {
      if (!this.treeData.infos[id]) return
      const userEmail = this.user?.email || 'Anonim'
      this.treeData.infos[id] = { ...this.treeData.infos[id], ...info, updatedAt: new Date().toISOString(), updatedBy: userEmail }
      await this.saveData()
    },

    async deleteMember(id) {
      if (!this.treeData.nodes[id]) return
      for (const [nodeId, node] of Object.entries(this.treeData.nodes)) {
        if (nodeId === id) continue
        node.relations = node.relations.filter(r => r.to !== id)
      }
      delete this.treeData.nodes[id]
      delete this.treeData.infos[id]
      await this.saveData()
    },

    async addRelation(fromId, toId, type) {
      const now = new Date().toISOString()
      const fromNode = this.treeData.nodes[fromId]
      const toNode = this.treeData.nodes[toId]
      if (!fromNode || !toNode) return false
      if (fromNode.relations.some(r => r.to === toId && r.type === type)) return false

      fromNode.relations.push({ to: toId, type, addedAt: now, updatedAt: now })
      const reverseType = type === 'child' ? 'parent' : (type === 'parent' ? 'child' : type)

      if (!toNode.relations.some(r => r.to === fromId && r.type === reverseType)) {
        toNode.relations.push({ to: fromId, type: reverseType, addedAt: now, updatedAt: now })
      }

      if (type === 'spouse') {
        const children = fromNode.relations.filter(r => r.type === 'child')
        for (const child of children) {
          if (!toNode.relations.some(r => r.to === child.to && r.type === 'child')) {
            toNode.relations.push({ to: child.to, type: 'child', addedAt: now, updatedAt: now })
          }
          const childNode = this.treeData.nodes[child.to]
          if (childNode && !childNode.relations.some(r => r.to === toId && r.type === 'parent')) {
            childNode.relations.push({ to: toId, type: 'parent', addedAt: now, updatedAt: now })
          }
        }
      }
      
      await this.saveData()
      return true
    },

    async removeRelation(fromId, toId, type) {
      const fromNode = this.treeData.nodes[fromId]
      const toNode = this.treeData.nodes[toId]
      if (!fromNode || !toNode) return false

      fromNode.relations = fromNode.relations.filter(r => !(r.to === toId && r.type === type))
      const reverseType = type === 'child' ? 'parent' : (type === 'parent' ? 'child' : type)
      toNode.relations = toNode.relations.filter(r => !(r.to === fromId && r.type === reverseType))
      
      await this.saveData()
      return true
    },

    setRootId(id) {
      this.rootId = id
      if (id) localStorage.setItem('silsilah_root_id', id)
      else localStorage.removeItem('silsilah_root_id')
    }
  }
})
