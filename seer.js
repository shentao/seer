const Seer = (function () {
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
      for (const childNode of node.children) {
        parseDOM(childNode, observable)
      }
    } else {
      if (node.attributes.hasOwnProperty('sync')) {
        syncDOM(observable, node, node.attributes['sync'].value)
      }
      return
    }
  }

  const toObservable = function (obj) {
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        makeReactive(obj, prop, obj[prop])
      }
    }
    Seer.parseDOM(document.body, myObj)
  }
  const makeReactive = function (obj, key, val) {
    const getter = obj[key].get
    const setter = obj[key].set

    Object.defineProperty(obj, key, {
      get () {
        return val
      },
      set (newVal) {
        if (newVal === val) return
        val = newVal
        notify(key, newVal)
      }
    })
  }
  return {
    syncDOM,
    observe,
    toObservable,
    parseDOM
  }
}())

let myObj = {
  value: 1,
  multipleValue: 1,
  name: 'Hello Monterail'
}

Seer.toObservable(myObj)
function increment () {
  myObj.value++
  myObj.multipleValue = myObj.value * myObj.value
}

function updateName (event) {
  myObj.name = event.target.value.split("").reverse().join("")
}
