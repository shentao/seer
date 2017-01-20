function Seer (config) {
  let signals = {}
  let Dep = {
    // Name of the currently evaluated computed value
    // Doesn’t get overriden even if it depends on other computed values
    target: null,
    // Stores dependency keys of computed values
    subs: {},
    // Used to store the cache of a computed value
    cache: {},
    // Used to clear the cache of a computed value
    clearCache (property) {
      this.cache[property] = null
    }
  }

  observeData(config.data)
  subscribeWatchers(config.watch)

  return {
    data: config.data,
    observe,
    notify
  }

  function subscribeWatchers(watchers) {
    for (let key in watchers) {
      if (watchers.hasOwnProperty(key)) {
        observe(key, watchers[key])
      }
    }
  }

  function observe (property, signalHandler) {
    if(!signals[property]) signals[property] = []

    signals[property].push(signalHandler)
  }

  function notify (signal, val) {
    if(!signals[signal] || signals[signal].length < 1) return

    signals[signal].forEach(signalHandler => signalHandler(val))
  }

  function makeReactive (obj, key, computeFunc) {
    let deps = []
    let val = obj[key]

    Object.defineProperty(obj, key, {
      get () {
        // Run only when getting within a computed value context
        if (Dep.target) {
          // Add the computed value as depending on this value
          // if not yet added
          if (!deps.includes(Dep.target)) {
            deps.push(Dep.target)
          }
          // Add this value as a dependency of the computed value
          // if not yet added
          if (!Dep.subs[Dep.target].includes(key)) {
            Dep.subs[Dep.target].push(key)
          }
        }

        return val
      },
      set (newVal) {
        val = newVal

        // If it has computed values that depend on this value
        if (deps.length) {
          // Filter only valid dependencies to remove dead dependencies
          // that were not used during last computation
          deps = deps.filter(dep => {
            return Dep.subs[dep].includes(key)
          })
          deps.forEach(dep => {
            // Invalidate cache for given computed value by removing it
            Dep.clearCache(dep)
            // Notify computed value observers
            notify(dep)
          })
        }
        // Notify current key observers
        notify(key, val)
      }
    })
  }

  function makeComputed (obj, key, computeFunc) {
    Object.defineProperty(obj, key, {
      get () {
        // If no cache for this value exists and
        // target context is different than evaluated context
        if (!Dep.cache[key] || Dep.target !== key) {
          // If there is no target at all yet
          if (!Dep.target) {
            // Set the currently evaluated context as the target context
            Dep.target = key
            // Clear dependencies list to ensure getting a fresh one
            Dep.subs[key] = []
          }
          // Calculate the computed value and save to cache
          Dep.cache[key] = computeFunc.call(obj)
        }

        // Clear the target context
        Dep.target = null
        return Dep.cache[key]
      },
      set () {
        // Do nothing!
      }
    })
  }

  function observeData (obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'function') {
          makeComputed(obj, key, obj[key])
        } else {
          makeReactive(obj, key)
        }
      }
    }
    parseDOM(document.body, obj)
  }

  function sync (attr, node, observable, property) {
    node[attr] = observable[property]
    observe(property, () => node[attr] = observable[property])
  }

  function parseDOM (node, observable) {
    const nodes = document.querySelectorAll('[s-text]')
    const inputs = document.querySelectorAll('[s-model]')

    nodes.forEach(node => {
      sync('textContent', node, observable, node.attributes['s-text'].value)
    })

    inputs.forEach(input => {
      sync('value', input, observable, input.attributes['s-model'].value)
    })
  }
}

const App = Seer({
  data: {
    firstName: 'Jon',
    lastName: 'Snow',
    firstName2: 'Sansa',
    lastName2: 'Stark',
    gender: 'male',
    fullName () {
      return this.gender === 'male'
        ? 'Mr ' + this.firstName + ' ' + this.lastName
        : 'Ms ' + this.firstName2 + ' ' + this.lastName2
    },
    fullNameLength () {
      const length = this.fullName.length - 4
      return length
        ? length
        : 'Full name not set'
    }
  },
  watch: {
    firstName (v) {
      console.log('firstName changed to: ', v)
    },
    onlyEvenLengthName (v) {
      console.log(v)
    }
  }
})

function updateText (property, e) {
	App.data[property] = e.target.value
}

function resetTitle () {
	App.data.title = "Game of Thrones"
}

function updateName (event) {
  App.data.firstName = event.target.value.split("").reverse().join("")
}

function logProperty (property) {
  console.log(App.data[property])
}
