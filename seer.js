const Stream = {
  where (cb) {
    return function () {
      if (cb.call(this)) {
        return 'elo'
      }
    }
    // return (v) => {
    //   console.log(this)
    //   if (cb(v)) {
    //     return v
    //   }
    // }
  }
}

function Seer (config) {
  let signals = {}
  let Dep = {
    target: null,
    cache: {},
    invalidate (property) {
      console.log('invalidating: ', property)
      this.cache[property] = null
    }
  }

  observeData(config.data)
  subscribeWatchers(config.watch)

  return {
    data: config.data,
    observe,
    notify,
    Stream
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
        if (Dep.target && deps.indexOf(Dep.target) === -1){
          deps.push(Dep.target)
          console.log(deps)
        }

        return val
      },
      set (newVal) {
        val = newVal

        if (deps.length) {
          console.log(key, 'is deps for: ', deps)
          deps.forEach(dep => Dep.invalidate(dep))
          deps.forEach(dep => notify(dep))
        }
        notify(key, val)
      }
    })
  }

  function makeComputed (obj, key, computeFunc) {
    Object.defineProperty(obj, key, {
      get () {
        if (!Dep.target) Dep.target = key
        // val = computeFunc.call(obj)
        // console.log(Dep.target, 'vs', key)
        if (Dep.cache[key] && Dep.target === key) {
          console.log('has cache for ', key , ': ', Dep.cache[key])
        } else {
          Dep.cache[key] = computeFunc.call(obj)
        }
        Dep.target = null
        return Dep.cache[key]
        // val = Dep.cache[key] || computeFunc.call(obj)
        // Dep.cache[key] = val
      },
      set () {}
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
  data: {
    firstName: 'Jon',
    lastName: 'Snow',
    firstName2: 'Sansa',
    lastName2: 'Stark',
    gender: 'male',
    age: 5,
    fullName () {
      console.log('computing fullName')
      return this.gender === 'male'
        ? 'Mr ' + this.firstName + ' ' + this.lastName
        : 'Ms ' + this.firstName2 + ' ' + this.lastName2
    },
    fullNameLength () {
      console.log('computing fullNameLength')
      const length = this.fullName.length - 4
      return length
        ? length
        : 'Full name not set'
    }
    // onlyEvenLengthName: Stream.where(function () {
    //   return this.firstName.length % 2 === 0
    // })
  },
  watch: {
    firstName (v) {
      // console.log('firstName changed to: ', v)
    },
    onlyEvenLengthName (v) {
      // console.log(v)
    }
  }
  // stream: {
  //   eachDecade: {
  //     from: 'age',
  //     operator (i) {
  //
  //     }
  //     next (v) {
  //       console.log('on next: ', v)
  //     }
  //   }
  // }
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

App.observe('age', () => {
  App.data.ageError = parseInt(App.data.age) > 18 ? '' : 'Too young to watch'
})

function addToCart () {
  App.data.items++
}
