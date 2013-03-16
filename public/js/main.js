jQuery(function($) {
  'use strict';

  var Utils = {
    bindVisibilityFn: function() {
      /**
       * Bind Invisible, visible events to jquery object.
       */

      $.fn.invisible = function() {
        return this.css('visibility', 'hidden');
      };

      $.fn.visible = function() {
        return this.css('visibility', 'visible');
      }
    }
  };

  var App = {
    init: function() {
      this.DEFAULT_REDIRECT_URI = '/';
      Utils.bindVisibilityFn();
      this.cacheElements();
      this.bindEvents();
      this.setupElements();
    },

    cacheElements: function() {
      this.$document            = $(document);
      this.$loading             = $('#loading');
      this.$main                = $('#main');
      this.$userLoginActions    = $('#user-login-actions > form');
      this.$userRegisterActions = $('#user-register-actions > form');
      this.$userSocialActions   = $('#user-social-actions > div');
      this.$window              = $(window);
    },

    bindEvents: function() {
      /** 
       * PJAX Partial bindings.
       */
      this.$document.on('pjax:send', this.pjaxSend);
      this.$document.on('pjax:complete', this.pjaxComplete);

      /** 
       * User Actions (login, register) bindings
       */
      this.$userLoginActions.on('focusin', this.focusOnUserLogin);
      this.$userRegisterActions.on('focusin', this.focusOnUserRegister);
      this.$userSocialActions.on('focusin', this.focusOnUserSocial)
      this.$userLoginActions.on('click', this.focusOnUserLogin);
      this.$userRegisterActions.on('click', this.focusOnUserRegister);
      this.$userSocialActions.on('click', this.focusOnUserSocial);
    },

    setupElements: function() {
      this.$document.pjax('a:not([data-refresh])', '#main');
    },

    focusOnUserAction: function(action) {
      if (action === 'login') {
        this.$userLoginActions.removeClass('unfocused');
        this.$userRegisterActions.addClass('unfocused');
        this.$userSocialActions.addClass('unfocused');
      } else if (action === 'register') {
        this.$userRegisterActions.removeClass('unfocused');
        this.$userLoginActions.addClass('unfocused');
        this.$userSocialActions.addClass('unfocused');
      } else if (action === 'social') {
        this.$userSocialActions.removeClass('unfocused');
        this.$userLoginActions.addClass('unfocused');
        this.$userRegisterActions.addClass('unfocused');
      }
    },

    focusOnUserLogin: function(event) {
      App.focusOnUserAction('login');
    },

    focusOnUserRegister: function(event) {
      App.focusOnUserAction('register');
    },

    focusOnUserSocial: function(event) {
      App.focusOnUserAction('social');
    },

    pjaxComplete: function(event, xhr) {
      App.$loading.invisible();
      var title = xhr.getResponseHeader('X-PJAX-TITLE');
      if (title) { document.title = title; }
    },

    pjaxSend: function() {
      App.$loading.visible();
    }
  };

  App.init();
 });