function Seer (dataObj) {
  let signals = {}

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

    signals[signal].forEach((signalHandler) => signalHandler())
  }

  function makeReactive (obj, key) {
    let val = obj[key]

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

  function observeData (obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        makeReactive(obj, key)
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
  age: 25,
  ageError: '',
  items: 0
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
