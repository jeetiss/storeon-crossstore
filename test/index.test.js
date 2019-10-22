let createStore = require('storeon')

let crossstore = require('../')

let defaultKey = 'crossStore'

let createCallbacks = (key = defaultKey) => {
  let type = 'simulate'

  let subscribe = cb => {
    let handler = e => cb(e.detail)

    window.addEventListener(type, handler)
    return () => window.addEventListener(type, handler)
  }

  return {
    send: jest.fn(),
    subscribe: jest.fn(subscribe),
    simulate: (name, data) => {
      let event = new CustomEvent(type, { detail: [key, name, data] })
      dispatchEvent(event)
    }
  }
}

function increment (store) {
  store.on('@init', () => {
    return { count: 0, trim: true }
  })

  store.on('inc', state => {
    return { count: state.count + 1 }
  })
}

it('dispatch actions calls send', () => {
  let eventName = 'inc'
  let data = { hello: 'world' }
  let { send, subscribe } = createCallbacks()

  let store = createStore([increment, crossstore({ send, subscribe })])

  store.dispatch(eventName, data)

  expect(send).toHaveBeenCalledTimes(1)
  expect(subscribe).toHaveBeenCalledTimes(1)
  expect(send).toHaveBeenCalledWith([defaultKey, eventName, data])
})

it('simulate actions update state', () => {
  let eventName = 'inc'
  let data = { hello: 'world' }
  let { send, subscribe, simulate } = createCallbacks()

  let store = createStore([increment, crossstore({ send, subscribe })])

  simulate(eventName, data)
  simulate(eventName, data)

  expect(send).not.toHaveBeenCalled()
  expect(subscribe).toHaveBeenCalledTimes(1)

  let { count } = store.get()

  expect(count).toBe(2)
})

it('filtering dispatch actions', () => {
  let eventName = 'inc'
  let data = { testFilter: 'done?' }
  let { send, subscribe } = createCallbacks()

  let filter = function (event) {
    return event !== eventName
  }

  let store = createStore([increment, crossstore({ send, subscribe, filter })])

  store.dispatch(eventName, data)

  expect(subscribe).toHaveBeenCalledTimes(1)
  expect(send).not.toHaveBeenCalled()
})

it('filtering more dispatch actions', () => {
  let eventName = 'inc'

  let dataFirst = { first: 'test' }
  let dataSecond = { test: 'two' }
  let dataThird = { filterField: 'done?' }

  let { send, subscribe } = createCallbacks()

  let filter = function (event, data) {
    return !Object.hasOwnProperty.call(data, 'filterField')
  }

  let store = createStore([increment, crossstore({ send, subscribe, filter })])

  store.dispatch(eventName, dataFirst)
  store.dispatch(eventName, dataSecond)
  store.dispatch(eventName, dataThird)

  expect(send).toHaveBeenCalledTimes(2)
  expect(subscribe).toHaveBeenCalledTimes(1)
  expect(send).toHaveBeenCalledWith([defaultKey, eventName, dataSecond])
})
