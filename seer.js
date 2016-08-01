function Seer (initObj) {
  let signals = {}
  const observe = function (signal, signalHandler) {
    if(!signals[signal]) signals[signal] = []

    signals[signal].push(signalHandler)
  }
  const notify = function (signal, newVal) {
    if(!signals[signal] || signals[signal].length < 1) return

    signals[signal].forEach(function(signalHandler) {
      signalHandler(newVal || {})
    })
  }

  const syncDOM = function (obj, node, observableName) {
    node.textContent = obj[observableName]
    observe(observableName, (value) => node.textContent = obj[observableName])
  }
  const parseDOM = function (node, observable) {
    if (node.children.length > 0) {
      for (let childNode of node.children) {
        parseDOM(childNode, observable)
      }
    } else {
      if (node.attributes.hasOwnProperty('sync')) {
        syncDOM(observable, node, node.attributes['sync'].value)
      }
      return
    }
  }

  const observeData = function (obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && !obj[key].length) {
          observeData(obj[key])
        } else {
          makeReactive(obj, key, obj[key])
        }
      }
    }
    parseDOM(document.body, obj)
  }

  const makeReactive = function (obj, key, val, getter = false) {
    val = getter ? getter() : val

    Object.defineProperty(obj, key, {
      get () {
        return val
      },
      set (newVal) {
        val = newVal
        notify(key, newVal)
      }
    })
  }

  const observeComputed = function (obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        observeDeps(key, obj[key].deps, obj[key].getter, obj[key].setter)
      }
    }
  }

  const observeDeps = function (key, deps, getter) {
    for (const dep of deps) {
      observe(dep, () => notify(key))
    }
    this.data = initObj.data
    Object.defineProperty(initObj.data, key, {
      get () {
        return getter()
      }
    })
  }

  observeComputed(initObj.computed, initObj.data)
  observeData(initObj.data)
  return initObj
}


const app = new Seer({
  data: {
    value: 1,
    multipleValue: [1, 2],
    firstName: 'Jon',
    lastName: 'Snow'
  },
  computed: {
    reversedName: {
      deps: ['fullName'],
      getter () {
        return this.data.fullName.split('').reverse().join('')
      }
    },
    fullName: {
      deps: ['firstName', 'lastName'],
      getter () {
        return this.data.firstName + ' ' + this.data.lastName
      }
    },
    reversedNameWithLastName: {
      deps: ['reversedName', 'lastName'],
      getter () {
        return this.data.reversedName + ' ' + this.data.lastName
      }
    }
  }
})

function increment () {
  app.data.value++
  app.data.multipleValue = app.data.value * app.data.value
}

function updateInput (target, event) {
  app.data[target] = event.target.value
}
