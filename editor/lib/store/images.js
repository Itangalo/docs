import Vue from 'vue'
import { find } from 'lodash'
import { drive } from "../services/google"

const ImagesModule = {
  state: {
    imageFolders: []
  },

  getters: {
    imageFolders: state => state.imageFolders,

    findFolder: state => idToFind => {
      return find(state.imageFolders, { id: idToFind })
    },

    folderExists: (state, getters) => (idToFind) => {
      return !!getters.findFolder(idToFind)
    }
  },

  mutations: {
    addImageFolder(state, folder) {
      state.imageFolders.push(folder)
    },

    setImageFolderIndex(state, { folder, index }) {
      Vue.set(folder, "index", index)
    }
  },

  actions: {
    addImageFolder({ dispatch, commit, getters }, { id, name }) {
      if(getters.folderExists(id)) {
        throw new Error("Attempted to add duplicate folder")
      } else {
        commit("addImageFolder", { id, name })
      }
      // Fetch and store the file index for the folder
      return dispatch("refreshImageFileIndex", id)
    },

    addImageFolderViaLink({ dispatch }, folderLink) {
      // Signal status changes along the way
      // Make a Drive request for the folder
      return drive.getFolder(folderLink)
        .spread((folderId, folderName) => {
          // Store the name and ID of the folder
          return dispatch("addImageFolder", { id: folderId, name: folderName })
        })
    },

    // "index", like a listing of files with their metadata but not content
    refreshImageFileIndex({ commit, getters }, imageFolderId) {
      return drive.getIndex(imageFolderId, { mimeType: 'IMAGE' })
        .then((imageFolderIndex) => {
          const folder = getters.findFolder(imageFolderId)
          commit("setImageFolderIndex", { folder, index: imageFolderIndex})
        })
    }
  }
}

export default ImagesModule
