function Seer (dataObj) {
  let signals = {}
  let Dep = {
    target: null
  }

  observeData(dataObj)

  return {
    data: dataObj,
    observe,
    notify
  }

  function observe (property, signalHandler) {
    if(!signals[property]) signals[property] = []

    signals[property].push(signalHandler)
  }

  function notify (signal) {
    if(!signals[signal] || signals[signal].length < 1) return

    signals[signal].forEach(signalHandler => signalHandler())
  }

  function makeReactive (obj, key, computeFunc) {
    let deps = []
    let val = obj[key]

    Object.defineProperty (obj, key, {
      get () {
        if (computeFunc) {
          if (!Dep.target) Dep.target = key
          val = computeFunc.call(obj)
          Dep.target = null
        } else {
          if (Dep.target && deps.indexOf(Dep.target) === -1){
            deps.push(Dep.target)
          }
        }

        return val
      },
      set (newVal) {
        val = newVal

        if (deps.length) {
          deps.forEach(dep => notify(dep))
        }
        notify(key)
      }
    })
  }

  function observeData (obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'function') {
          makeReactive(obj, key, obj[key])
        } else {
          makeReactive(obj, key)
        }
      }
    }
    parseDOM(document.body, obj)
  }

  function syncNode (node, observable, property) {
    node.textContent = observable[property]
    observe(property, () => node.textContent = observable[property])
  }

  function parseDOM (node, observable) {
    const nodes = document.querySelectorAll('[s-text]')

    nodes.forEach((node) => {
      syncNode(node, observable, node.attributes['s-text'].value)
    })
  }
}

const App = Seer({
  title: 'Game of Thrones',
  firstName: 'Jon',
  lastName: 'Snow',
  firstName2: 'Sansa',
  lastName2: 'Stark',
  age: 25,
  ageError: '',
  items: 0,
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

App.observe('age', () => {
  App.data.ageError = parseInt(App.data.age) > 18 ? '' : 'Too young to watch'
})

function addToCart () {
  App.data.items++
}
