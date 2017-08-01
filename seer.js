/** @jsx h */
import { updateElement, h } from './vdom'

export default function Seer (config) {
  class ObservableArray extends Array {
    constructor (args, path) {
      super(...args)
      this.__proto__.path = path
    }
    push (...args) {
      super.push(...args)
      notify(this.__proto__.path)
    }
    fill (...args) {
      super.fill(...args)
      notify(this.__proto__.path)
    }
    sort (...args) {
      super.sort(...args)
      notify(this.__proto__.path)
    }
    unshift (...args) {
      super.unshift(...args)
      notify(this.__proto__.path)
    }
    reverse () {
      super.reverse()
      notify(this.__proto__.path)
    }
    shift () {
      super.shift()
      notify(this.__proto__.path)
    }
    pop () {
      super.pop()
      notify(this.__proto__.path)
    }
    splice (...args) {
      super.splice(...args)
      notify(this.__proto__.path)
    }
  }

  let signals = {}
  let Dep = {
    // Name of the currently evaluated computed value
    // Doesn’t get overriden even if it depends on other computed values
    target: null,
    // Stores dependency keys of computed values
    subs: {
      '_render': []
    },
    depend (deps, dep) {
      // Add the computed value as depending on this value
      // if not yet added
      if (deps && !deps.includes(this.target)) {
        deps.push(this.target)
      }
      // Add this value as a dependency of the computed value
      // if not yet added
      if (Dep.subs[this.target] && !Dep.subs[this.target].includes(dep)) {
        Dep.subs[this.target].push(dep)
      }
    },
    getValidDeps (deps, key) {
      // Filter only valid dependencies by removing dead dependencies
      // that were not used during last computation
      return deps.filter(dep => this.subs[dep].includes(key))
    },
    notifyDeps (deps) {
      // notify all existing deps
      deps.forEach(notify)
    }
  }
  let $root
  let $lastVirtualNode

  return {
    data: config.data,
    observe,
    notify,
    $mount: mount
  }

  function render (parent = $root) {
    Dep.target = '_render'
    $lastVirtualNode = updateElement(parent, config.render.call(config.data, h), $lastVirtualNode)
    Dep.target = null
  }

  function mount (query) {
    $root = document.querySelector(query)
    observeData(config.data)
    subscribeWatchers(config.watch, config.data)

    render()

    observe('_render', () => { render() })
    return {
      data: config.data,
      observe,
      notify,
      $forceUpdate: render
    }
  }

  function subscribeWatchers(watchers, context) {
    for (let key in watchers) {
      if (watchers.hasOwnProperty(key)) {
        observe(key, watchers[key].bind(context))
      }
    }
  }

  function observe (property, signalHandler) {
    if(!signals[property]) signals[property] = []

    signals[property].push(signalHandler)
  }

  function notify (signal) {
    if(!signals[signal] || signals[signal].length < 1) return

    signals[signal].forEach(signalHandler => signalHandler())
  }

  function makeReactive (obj, key, prefix, isArray) {
    let deps = []
    const path = prefix.concat([key]).join('.')
    let val = isArray
      ? new ObservableArray(obj[key], path)
      : obj[key]

    Object.defineProperty(obj, key, {
      get () {
        // Run only when getting within a computed value context
        if (Dep.target) {
          Dep.depend(deps, key)
        }

        return val
      },
      set (newVal) {
        val = isArray
          ? new ObservableArray(newVal, path)
          : newVal

        // Clean up and notify valid deps
        deps = Dep.getValidDeps(deps, key)
        Dep.notifyDeps(deps, key)

        // Notify current key observers
        notify(path)
      }
    })
  }

  function makeComputed (obj, key, computeFunc) {
    let cache = null
    let deps = []

    // Observe self to clear cache when deps change
    observe(key, () => {
      // Clear cache
      cache = null

      // Clean up and notify valid deps
      deps = Dep.getValidDeps(deps, key)
      Dep.notifyDeps(deps, key)
    })

    Object.defineProperty(obj, key, {
      get () {
        // If within a computed value context other than self
        if (Dep.target) {
          // Make this computed value a dependency of another
          Dep.depend(deps, key)
        }
        // Normalize Dep.target to self
        Dep.target = key

        if (!cache) {
          // Clear dependencies list to ensure getting a fresh one
          Dep.subs[key] = []
          // Calculate new value and save to cache
          cache = computeFunc.call(obj)
        }

        // Clear the target context
        Dep.target = null
        return cache
      },
      set () {
        // Do nothing!
      }
    })
  }

  function observeData (obj) {
    walk(obj)
  }

  function walk(obj, prefix = []) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'function') {
          makeComputed(obj, key, obj[key])
        } else {
          if (Array.isArray(obj[key])) {
            makeReactive(obj, key, prefix, true)
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            walk(obj[key], prefix.concat(key))
          } else {
            makeReactive(obj, key, prefix)
          }
        }
      }
    }
  }
}
