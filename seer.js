function Seer (initObj) {
  let signals = {}

  observeComputed(initObj.computed, initObj.data)
  observeData(initObj.data)

  return {
    observe,
    notify,
    data: initObj.data,
  }

  function observe (signal, signalHandler) {
    if(!signals[signal]) signals[signal] = []

    signals[signal].push(signalHandler)
  }

  function notify (signal) {
    if(!signals[signal] || signals[signal].length < 1) return

    signals[signal].forEach((signalHandler) => signalHandler())
  }

  function syncDOM (obj, node, observableName) {
    node.textContent = obj[observableName]
    observe(observableName, value => node.textContent = obj[observableName] || '')
  }

  function parseDOM (node, observable) {
    const nodes = document.querySelectorAll('[sync]')
    nodes.forEach((node) => {
      syncDOM(observable, node, node.attributes['sync'].value)
    })
    // for (const node of nodes) {
    // }
    // if (node.children.length > 0) {
    //   for (let childNode of node.children) {
    //     parseDOM(childNode, observable)
    //   }
    // }
    // if (node.attributes.hasOwnProperty('sync')) {
    //   syncDOM(observable, node, node.attributes['sync'].value)
    // }
    // return
  }

  function observeData (obj) {
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

  function makeReactive (obj, key, val) {
    Object.defineProperty(obj, key, {
      get () {
        return val
      },
      set (newVal) {
        val = newVal
        notify(key)
      }
    })
  }

  function observeDeps (obj, key, getter, setter) {
    for (const dep of obj[key].deps) {
      observe(dep, () => notify(key))
    }
    // This could be merged with makeReactive
    Object.defineProperty(initObj.data, key, {
      get () {
        return getter.call(initObj.data)
      },
      set (newVal) {
        return setter.call(initObj.data, newVal)
      }
    })
  }

  function observeComputed (obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        observeDeps(obj, key, obj[key].getter, obj[key].setter)
      }
    }
  }
}


const App = new Seer({
  data: {
    // Currently supports only primitive values
    // TODO: Support arrays and nested objects
    value: 1,
    multipleValue: 1,
    firstName: 'Jon',
    lastName: 'Snow'
  },
  computed: {
    reversedName: {
      deps: ['fullName'],
      getter () {
        return this.fullName.split('').reverse().join('')
      }
    },
    fullName: {
      deps: ['firstName', 'lastName'],
      getter () {
        return this.firstName + ' ' + this.lastName
      },
      setter (fullName) {
        fullName = fullName.split(' ')
        this.firstName = fullName[0] || ''
        this.lastName = fullName[1] || ''
      }
    },
    reversedNameWithLastName: {
      deps: ['reversedName', 'lastName'],
      getter () {
        return this.reversedName + ' ' + this.lastName
      }
    }
  }
})

// To subscribe and react to changes made to the reactive App object:
// App.observe('firstName', () => console.log(App.data.firstName))
// App.observe('lastName', () => console.log(App.data.lastName))

// To access or change the reactive data simply do:
// App.data.firstName = 'Sansa'
// App.data.lastName = 'Stark'

function increment () {
  App.data.value++
  App.data.multipleValue = App.data.value * App.data.value
}

function updateInput (target, event) {
  App.data[target] = event.target.value
}
