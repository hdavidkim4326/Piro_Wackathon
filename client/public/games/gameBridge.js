;(function initCampusTurfGameBridge(global) {
  'use strict'

  var MESSAGE_TYPE = 'GAME_RESULT'

  function normalizeSuccess(value) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      var lowered = value.trim().toLowerCase()
      if (lowered === 'true' || lowered === 'success') return true
      if (lowered === 'false' || lowered === 'fail' || lowered === 'failed') return false
    }
    return null
  }

  function postResult(payload) {
    if (!payload || typeof payload !== 'object') {
      console.error('[CampusTurfGameBridge] payload must be an object')
      return null
    }

    var gameId = Number(payload.gameId)
    var success = normalizeSuccess(payload.success)

    if (!Number.isInteger(gameId) || gameId < 1) {
      console.error('[CampusTurfGameBridge] invalid gameId:', payload.gameId)
      return null
    }

    if (success === null) {
      console.error('[CampusTurfGameBridge] invalid success value:', payload.success)
      return null
    }

    var message = {
      type: MESSAGE_TYPE,
      gameId: gameId,
      success: success,
    }

    var score = Number(payload.score)
    if (Number.isFinite(score)) {
      message.score = score
    }

    var gameLevel = Number(payload.gameLevel)
    if (Number.isFinite(gameLevel) && gameLevel > 0) {
      message.gameLevel = gameLevel
    }

    if (global.parent && typeof global.parent.postMessage === 'function') {
      global.parent.postMessage(message, '*')
    } else {
      console.warn('[CampusTurfGameBridge] parent window is not available')
    }

    return message
  }

  global.CampusTurfGameBridge = {
    MESSAGE_TYPE: MESSAGE_TYPE,
    postResult: postResult,
  }
})(window)
