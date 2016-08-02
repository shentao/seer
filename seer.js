function Seer (initObj) {
  let dependencies = []
  let currentDepId = 0

  let signals = {}
  const observe = function (signal, signalHandler) {
    if(!signals[signal]) signals[signal] = []

    signals[signal].push(signalHandler)
  }
  const notify = function (signal) {
    if(!signals[signal] || signals[signal].length < 1) return


    for (const handler of signals[signal]) {
      handler()
    }
  }

  const syncDOM = function (obj, node, observableName) {
    node.textContent = obj[observableName]
    observe(observableName, (value) => node.textContent = obj[observableName] || '')
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

  const makeReactive = function (obj, key, val) {
    const property = Object.getOwnPropertyDescriptor(obj, key)

    const getter = property && property.get
    const setter = property && property.set

    Object.defineProperty(obj, key, {
      get () {
        const value = getter ? getter.call(obj) : val
        return value
      },
      set (newVal) {
        if (setter) {
          setter.call(obj, newVal)
        } else {
          val = newVal
        }
        notify(key)
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

  const observeDeps = function (key, deps, getter, setter) {
    for (const dep of deps) {
      observe(dep, () => notify(key))
    }
    this.data = initObj.data
    Object.defineProperty(initObj.data, key, {
      get () {
        return getter()
      },
      set (newVal) {
        setter(newVal)
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
    multipleValue: 1,
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
      },
      setter (fullName) {
        fullName = fullName.split(' ')
        this.data.firstName = fullName[0] || ''
        this.data.lastName = fullName[1] || ''
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
