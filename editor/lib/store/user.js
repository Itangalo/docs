const UsersModule = {
  state: {
    idToken: null,
    authenticated: false,
    name: '',
    avatarSrc: null,
    loginError: null
  },

  getters: {
    loggedIn: state => state.authenticated,
    loginError: state => state.loginError,
    userId: state => state.idToken,
    userName: state => state.name,
    userAvatar: state => state.avatarSrc || "/images/blank-avatar.png"
  },

  mutations: {
    become(state, user) {
      state.authenticated = true
      state.idToken       = user.idToken
      state.name          = user.name
      state.avatarSrc     = user.avatarSrc
    },

    setLoginError(state, errorType) {
      state.loginError = errorType
    },

    logout() { }
  },

  actions: {
    become({ commit }, user) {
      commit("resetState")
      commit("become", user)
    },

    login({ dispatch, commit }) {
      commit("setLoginError", null)
      return dispatch("googleLoginFlow")
        .then((googleUser) => {
          // We're logged into Google, set up the local user
          return dispatch("become", {
            idToken:   googleUser.getBasicProfile().getEmail(),
            name:      googleUser.getBasicProfile().getName(),
            email:     googleUser.getBasicProfile().getEmail(),
            avatarSrc: googleUser.getBasicProfile().getImageUrl()
          })
        })

        .then(() => {
          return dispatch("googleDatabaseLookup")
            .then((foundDatabase) => {
              if(foundDatabase) {
                // There's a remote database already, load it
                dispatch("resetState", foundDatabase)
              } else {
                // No remote database, create one
                dispatch("googleDatabaseInitialize")
              }
            })
        })

        .catch((error) => {
          commit("setLoginError", error.message)
          return null
        })
    },

    logout({ commit, dispatch }) {
      commit("resetState")
      commit("logout")
      dispatch("googleLogout")
    }
  }
}

export default UsersModule
