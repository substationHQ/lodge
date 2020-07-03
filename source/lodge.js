/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-underscore-dangle */

/**
 *
 * △△
 * The core lodge.js file
 *
 * COMPRESSION SETTINGS
 * http://closure-compiler.appspot.com/
 * Closure compiler, SIMPLE MODE
 *
 * @author Jesse von Doom
 * @link http://lodge.glitch.me/
 *
 * Copyright (c) 2019, Jesse von Doom
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list
 * of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this
 * list of conditions and the following disclaimer in the documentation and/or other
 * materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 * OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * */

if (!window.lodge) {
  // lodge hasn't been defined, so let's go
  window.lodge = (function lodge() {
    // eslint-disable-next-line no-shadow
    const lodge = {
      embedded: false,
      eventlist: {},
      get: {},
      lightbox: false,
      loaded: false,
      name: "",
      options: "",
      parent: "",
      path: "",
      scripts: [],
      storage: {},
      templates: {},

      // eslint-disable-next-line consistent-return
      _init() {
        const vv = window.lodge;

        // look for GET string, parse that shit if we can
        vv.get.qs = window.location.search.substring(1);
        vv.get.params = false;

        if (vv.get.qs) {
          vv.get.params = {};
          let t;
          const q = vv.get.qs.split("&");
          for (let i = 0; i < q.length; i++) {
            t = q[i].split("=");
            vv.get.params[t[0]] = decodeURIComponent(t[1]);
          }
        }

        if (vv.get.params.debug) {
          vv.debug.show = true;
        }

        // if we're running in an iframe assume it's an embed (won't do any harm if not)
        if (self !== top) {
          // first check for noembed. if we find it AND we're in an iframe die immediately
          if (vv.options.indexOf("noembed") !== -1) {
            return false;
          }
          vv.styles.addClass({
            el: document.documentElement,
            className: "vv-embed",
          });
          vv._initEmbed();
        } else {
          vv.name = "main window";
        }

        // modal?
        if (vv.get.params.modal) {
          vv.styles.addClass({
            el: document.documentElement,
            className: "vv-modal",
          });
        }

        // check lightbox options
        const imgTest = document.querySelectorAll(
          "a.lodge.gallery,div.lodge.gallery"
        );
        if (vv.options.indexOf("lightboxvideo") !== -1 || imgTest.length > 0) {
          // load lightbox.js
          vv.loadScript(`${vv.path}/lightbox/lightbox.js`);
        }

        // using messages passed between the request and this script to resize the iframe
        window.addEventListener("message", function addMessage(e) {
          // make sure the message comes from our embeds OR the main embedding lodge.js instance (via origin whitelist)
          if (vv.embeds.whitelist.indexOf(e.origin) !== -1) {
            vv._handleMessage(e);
          }
        });

        // add current domain to whitelist for postmesage calls (regardless of embed or no)
        vv.embeds.whitelist += window.location.href
          .split("/")
          .slice(0, 3)
          .join("/");
        if (vv.get.params.location) {
          vv.embeds.whitelist += vv.get.params.location
            .split("/")
            .slice(0, 3)
            .join("/");
        }

        if (vv.embedded) {
          vv.loaded = Date.now(); // ready and loaded
          vv._drawQueuedEmbeds();
          if (vv.debug.show) {
            vv.debug.out("finished initializing", vv);
          }
          // tell em
          vv.events.fire(vv, "ready", vv.loaded);
        } else {
          // look for GET string, parse that shit if we can
          if (vv.get.qs) {
            if (
              vv.get.qs.indexOf("element_id") !== -1 ||
              vv.get.qs.indexOf("handlequery") !== -1
            ) {
              if (window.history && history.pushState) {
                // we know this is aimed at us, so we caught it. now remove it.
                history.pushState(
                  null,
                  null,
                  window.location.href.split("?")[0]
                );
              }
            }
          }

          // create overlay stuff first
          vv.overlay.create();
          vv.loaded = Date.now(); // ready and loaded
          // eslint-disable-next-line no-underscore-dangle
          vv._drawQueuedEmbeds();
          if (vv.debug.show) {
            vv.debug.out("finished initializing", vv);
          }
          // tell em
          vv.events.fire(vv, "ready", vv.loaded);
        }
      },

      _drawQueuedEmbeds() {
        const vv = window.lodge;
        if (typeof vv.storage.elementQueue === "object") {
          // this means we've got elements waiting for us...do a
          // foreach loop and start embedding them
          vv.storage.elementQueue.forEach(function drawComponent(embed) {
            // we stored the args in our queue...spit them back out
            vv.embeds.create(embed);
          });
        }
      },

      _initEmbed() {
        const vv = window.lodge;
        vv.embedded = true; // set this as an embed

        if (vv.get.params.lodgelocation) {
          vv.parent = vv.get.params.lodgelocation;
          vv.embeds.whitelist = `${vv.embeds.whitelist},${vv.parent}`;
        }

        if (vv.get.params.name) {
          vv.name = vv.get.params.name;
        } else {
          vv.name = window.location;
        }

        // rewrite CSS stuff?
        if (vv.get.params.cssoverride) {
          vv.styles.injectCSS({
            css: vv.get.params.cssoverride,
            important: true,
          });
        }

        // resize to fit
        if (!vv.get.params.fixedsize) {
          vv.storage.embedheight = vv.measure.scrollheight(); // store current height
          vv.events.fire(vv, "resize", { height: vv.storage.embedheight }); // fire resize event immediately

          // poll for height and fire resize event if it changes
          window.setInterval(function resizeIframe() {
            const h = vv.measure.scrollheight();
            if (h !== vv.storage.embedheight) {
              vv.storage.embedheight = h;
              vv.events.fire(vv, "resize", { height: h });
            }
          }, 250);
        }
      },

      _handleMessage(e) {
        const vv = window.lodge;
        const message = JSON.parse(e.data);
        const routing = {
          /*
          we'll pass message.data to the handler for each route.
          requre a script to load/verify it before firing the handler.
          (in an ideal world these would nest indefinitely, but it's
          not worth the extra array/reduce load. just a function name
          at the root of lodge or one object deep. 
          [function] OR [object.function])
          */
          addclass: { handler: "styles.addClass" },
          begincheckout: {
            handler: "checkout.begin",
            require: "checkout/checkout.js",
          },
          addoverlaytrigger: { handler: "overlay.addOverlayTrigger" },
          injectcss: { handler: "styles.injectCSS" },
          overlayhide: { handler: "overlay.hide" },
          overlayreveal: { handler: "overlay.reveal" },
          overlaysetloading: { handler: "overlay.setLoading" },
          removeclass: { handler: "styles.removeClass" },
          resize: { handler: "embeds.resize" },
          swapclasses: { handler: "styles.swapClasses" },
        };
        let lodgeMessage = true;

        try {
          // find the source of the message in our embeds object
          for (let i = 0; i < vv.embeds.all.length; i++) {
            if (vv.embeds.all[i].el.contentWindow === e.source) {
              if (!vv.embeds.all[i].el.source) {
                vv.embeds.all[i].source = e.source;
              }
              message.data._source = vv.embeds.all[i];
              break;
            }
          }
        } catch (ee) {
          lodgeMessage = false;
        }

        // we know it came from lodge, so let's figure out what to do with it
        if (lodgeMessage) {
          if (routing[message.type]) {
            const splitHandler = routing[message.type].handler.split(".");
            const handlerFunction = splitHandler.pop();
            let route = vv;
            if (splitHandler.length) {
              // after popping off the function there's still some handler left, meaning
              // we've got an object. grabbing the first value and assuming one level deep.
              route = vv[splitHandler[0]];
            }

            // we have a recognized type with a lodge handler
            if (!routing[message.type].require) {
              // no script dependency, so call the handler and pass the message data
              route[handlerFunction](message.data);
            } else {
              // there's a script dependency — load the script and set a callback
              // (if script is already loaded, loadScript will check and immediately do callback)
              vv.loadScript(
                `${vv.path}/${routing[message.type].require}`,
                function beginCheckout() {
                  route[handlerFunction](message.data);
                }
              );
            }
          } else if (message.type !== "ready") {
            // for anything else, we fire the event through the stack of embeds
            // (we do NOT fire for "ready" because we don't want to falsely trigger ready events)
            vv.events.fire(vv, message.type, message.data, false, true);
          }
        }
      },

      /** *************************************************************************************
       *
       * window.lodge.embeds (object)
       * Everything we need to create embed iframes
       *
       * PUBLIC-ISH FUNCTIONS
       *
       *
       * window.lodge.embed(string src, string options, string alt, object targetNode, string css)
       * Generates the embed iFrame code for embedding a given element.
       * Optional third and fourth parameters allow the element to be
       * embedded as a modal with a lightbox and to customize the text of modal
       * opener link. (default: 'open element')
       *
       * The iFrame is embedded at 1px high and sends a postMessage back
       * to this parent window with its proper height.
       *
       * This is called in a script inline as a piece of blocking script — calling it before
       * DomContentLoaded because the partial load tells us where to embed each chunk — we find the
       * last script node and inject the content by it. For dynamic calls you need to specify
       * a targetNode to serve as the anchor — with the embed chucked immediately after that
       * element in the DOM.
       ************************************************************************************** */
      embeds: {
        whitelist: "",
        all: [],

        /**
         * /// lodge.embeds.create
         * Formats and injects an iframe into the DOM
         *
         * @param {object} component
         * @param {string} component.src - The URL or relative link for the iframe source.
         * @param {number} [component.alt=open] - Taken from an embed's title parameter, this is used as link text for opening a modal component.
         * @param {object|string} component.target - A target DOM element used for location of the embed or open link (for modal components.) If a string is passed rather than a true DOM element it will be tested with queryselector.
         * @param {string} [component.css] - CSS override passed to the iframe, expecting a lodge-powered component.
         * @param {string} component.id - Taken from the embed id, this id will be used for the new iframe. The embed tag will be removed from the DOM, removing conflict.
         * @param {boolean} [component.modal=false] - Open the component in a modal, generating an open link in place of the embed element.
         */
        create({ src, alt = "open", target, css, id, modal = false }) {
          const vv = window.lodge;
          let currentNode;

          if (!vv.loaded) {
            // cheap/fast queue waiting on load.
            if (typeof vv.storage.elementQueue !== "object") {
              vv.storage.elementQueue = [];
            }
            // eslint-disable-next-line prefer-rest-params
            vv.storage.elementQueue.push({
              src,
              alt,
              target,
              css,
              id,
              modal,
            });
          } else {
            if (typeof targetNode === "string") {
              // for AJAX, specify target node: '#id', '#id .class', etc. NEEDS to be specific
              currentNode = document.querySelector(target);
            } else {
              currentNode = target;
            }

            const iframe = vv.embeds.buildIframe({ src, css, modal, id });

            // be nice neighbors. if we can't find currentNode, don't do the rest or pitch errors. silently fail.
            if (currentNode) {
              if (modal) {
                // create a span to contain the overlay link
                const embedNode = document.createElement("span");
                embedNode.className = "vv-modalopen";

                // open in a lightbox with a link in the target div
                vv.overlay.create(function addMarkup() {
                  const a = document.createElement("a");
                  a.href = "";
                  a.target = "_blank";
                  a.innerHTML = alt;
                  embedNode.appendChild(a);
                  currentNode.parentNode.insertBefore(embedNode, currentNode);
                  (function addEvents() {
                    a.addEventListener("click", function showIframe(e) {
                      vv.overlay.reveal({ innerContent: iframe });
                      e.preventDefault();
                      return false;
                    });
                  })();
                });
              } else {
                // put the iframe in place
                currentNode.parentNode.insertBefore(iframe, currentNode);
              }

              if (currentNode.tagName === "EMBED") {
                currentNode.parentNode.removeChild(currentNode);
              }
            }
          }
        },

        buildIframe({ src, cssoverride, querystring, id }) {
          const vv = window.lodge;
          const iframe = document.createElement("iframe");
          let embedURL = src;

          const originlocation = encodeURIComponent(
            `${location.protocol}//${location.hostname}${
              location.port ? `:${location.port}` : ""
            }`
          );
          embedURL += `?lodgelocation=${originlocation}`;

          if (cssoverride) {
            embedURL += `&cssoverride=${encodeURIComponent(cssoverride)}`;
          }
          if (querystring) {
            embedURL += `&${querystring}`;
          }
          if (vv.debug.show) {
            embedURL += "&debug=1";
          }

          if (!id) {
            id = `vv-${new Date().getTime()}`;
          }

          iframe.src = embedURL;
          iframe.id = id;
          iframe.className = "vv-embed";
          iframe.style.width = "100%";
          iframe.style.height = "0"; // if not explicitly set the scrollheight of the document will be wrong
          iframe.style.border = "0";
          iframe.style.overflow = "hidden"; // important for overlays, which flicker scrollbars on open
          iframe.scrolling = "no"; // programming

          let origin = window.location;
          if (embedURL.includes("://")) {
            origin = embedURL.split("/").slice(0, 3).join("/");
            if (vv.embeds.whitelist.indexOf(origin) === -1) {
              vv.embeds.whitelist += `,${origin}`;
            }
          }
          vv.embeds.all.push({
            id,
            el: iframe,
            src,
            source: null,
            origin,
          });
          vv.debug.store(`building iframe for ${src}`);

          return iframe;
        },

        resize({ _source, height }) {
          const embed = _source.el;
          embed.height = height;
          embed.style.height = `${height}px`; // resize to correct height
        },

        getById(id) {
          const vv = window.lodge;
          let embed = false;
          for (let i = 0; i < vv.embeds.all.length; i++) {
            if (vv.embeds.all[i].id === id) {
              embed = vv.embeds.all[i];
              break;
            }
          }
          return embed;
        },
      },

      getTemplate(templateName, successCallback, loadCSS) {
        const vv = window.lodge;
        const { templates } = vv;
        if (templates[templateName] !== undefined) {
          successCallback(templates[templateName]);
        } else {
          // get the template
          this.ajax.jsonp(
            `${vv.path}/templates/${templateName}.js`,
            "callback",
            function templateLoaded(json) {
              templates[templateName] = json.template;
              successCallback(json.template);
            },
            `lodge${templateName}Callback`
          );

          if (loadCSS !== false) {
            loadCSS = true;
          }

          if (loadCSS) {
            // check for existence of the CSS file and if not found, include it
            const test = document.querySelectorAll(
              `link[href="${vv.path}/templates/${templateName}.css"]`
            );
            if (!test.length) {
              // if nothing found
              vv.styles.injectCSS({
                css: `${vv.path}/templates/${templateName}.css`,
              });
            }
          }
        }
      },

      // stolen from jQuery
      loadScript(url, callback) {
        const vv = window.lodge;
        if (vv.scripts.indexOf(url) > -1) {
          if (typeof callback === "function") {
            callback();
          }
        } else {
          vv.scripts.push(url);
          const head =
            document.getElementsByTagName("head")[0] ||
            document.documentElement;
          const script = document.createElement("script");
          script.src = url;

          // Handle Script loading
          let done = false;

          // Attach handlers for all browsers
          // eslint-disable-next-line no-multi-assign
          script.onload = script.onreadystatechange = function attachHandlers() {
            if (
              !done &&
              (!this.readyState ||
                this.readyState === "loaded" ||
                this.readyState === "complete")
            ) {
              done = true;
              if (typeof callback === "function") {
                callback();
              }

              // Handle memory leak in IE
              // eslint-disable-next-line no-multi-assign
              script.onload = script.onreadystatechange = null;
              if (head && script.parentNode) {
                head.removeChild(script);
              }
            }
          };
          head.insertBefore(script, head.firstChild);
        }
        // log it
        if (vv.debug.show) {
          if (!vv.loaded) {
            vv.debug.store(`loaded script: ${url}`);
          } else {
            vv.debug.out(`loaded script: ${url}`);
          }
        }
      },

      /** *************************************************************************************
       *
       * window.lodge.debug (object)
       * Store debug messages for grouping OR dump a message / all stored messages
       *
       * PUBLIC-ISH FUNCTIONS
       * window.lodge.debug.store(string msg,optional object o)
       * window.lodge.debug.out(string msg,optional object o)
       *
       ************************************************************************************** */
      debug: {
        show: false,

        store(msg, o) {
          // making a debug message queue
          const vv = window.lodge;
          if (!vv.storage.debug) {
            vv.storage.debug = [];
          }
          vv.storage.debug.push({ msg, o });
        },

        out(msg, o) {
          const vv = window.lodge;

          let msgcolor = "000";
          if (vv.embedded) {
            msgcolor = "666";
          }

          if (!vv.storage.debug) {
            // no queue: just spit out the message and (optionally) object
            if (o) {
              console.log(
                `%c△△%c ${vv.name}:%c\n   ${msg} %o`,
                "color:#900;font-weight:bold;",
                `color:#${msgcolor};font-weight:bold;`,
                `color:#${msgcolor};font-weight:normal;`,
                o
              );
            } else {
              console.log(
                `%c△△%c ${vv.name}:%c\n   ${msg}`,
                "color:#900;font-weight:bold;",
                `color:#${msgcolor};font-weight:bold;`,
                `color:#${msgcolor};font-weight:normal;`
              );
            }
          } else {
            // queue: run through all of it as part of a collapsed group
            console.groupCollapsed(
              `%c△△%c ${vv.name}:%c\n   ${msg}`,
              "color:#900;font-weight:bold;",
              `color:#${msgcolor};font-weight:bold;`,
              `color:#${msgcolor};font-weight:normal;`
            );
            if (o) {
              console.log("   attachment: %o", o);
            }
            vv.storage.debug.forEach(function logMessages(d) {
              if (d.o) {
                console.log(`   ${d.msg} %o`, d.o);
              } else {
                console.log(`   ${d.msg}`);
              }
            });
            console.groupEnd();
            // now clear the debug queue
            delete vv.storage.debug;
          }
        },
      },

      /** *************************************************************************************
       *
       * window.lodge.ajax (object)
       * Object wrapping XHR calls cross-browser and providing form encoding for POST
       *
       * PUBLIC-ISH FUNCTIONS
       * window.lodge.ajax.send(string url, string postString, function successCallback)
       * window.lodge.ajax.encodeForm(object form)
       *
       ************************************************************************************** */
      ajax: {
        /*
         * window.lodge.ajax.send(string url, string postString, function successCallback)
         * Do a POST or GET request via XHR/AJAX. Passing a postString will
         * force a POST request, whereas passing false will send a GET.
         */
        send(url, postString, successCallback, failureCallback) {
          const method = "POST";
          const xhr = new XMLHttpRequest();
          if (xhr) {
            xhr.open(method, url, true);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            if (method === "POST") {
              xhr.setRequestHeader(
                "Content-type",
                "application/x-www-form-urlencoded"
              );
            }
            if (typeof successCallback === "function") {
              xhr.onreadystatechange = function doCallbacks() {
                if (xhr.readyState === 4) {
                  if (xhr.status === 200) {
                    successCallback(xhr.responseText);
                  } else if (typeof failureCallback === "function") {
                    failureCallback(xhr.responseText);
                  }
                }
              };
            }
            xhr.send(postString);
          }
        },

        jsonp(url, method, callback, forceCallbackName) {
          // lifted from Oscar Godson here:
          // http://oscargodson.com/posts/unmasking-jsonp.html

          // added the forceCallbackName bits, and callback queing/stacking

          url = url || "";
          method = method || "";
          callback = callback || function newFunction() {};
          forceCallbackName = forceCallbackName || false;

          let generatedFunction = null;
          let oldCallback = function oldCallback() {};

          if (typeof method === "function") {
            callback = method;
            method = "callback";
          }

          if (forceCallbackName) {
            // this is weird. it looks to see if the callback is already defined
            // if it is it means we hit a race condition loading the template and
            // handling the callback.
            generatedFunction = forceCallbackName;
            if (typeof window[generatedFunction] === "function") {
              // we grab the old callback, create a new closure for it, and call
              // it in our new callback — nests as deep as it needs to go, calling
              // every callback in reverse order
              oldCallback = window[generatedFunction];
            }
          } else {
            generatedFunction = `jsonp${Math.round(Math.random() * 1000001)}`;
          }

          window[generatedFunction] = function generated(json) {
            callback(json);
            if (!forceCallbackName) {
              delete window[generatedFunction];
            } else {
              // here we start the weird loop down through all the defined
              // callbacks. if no callbacks were defined oldCallback is an
              // empty function so it does nothing.
              oldCallback(json);
            }
          };

          if (url.indexOf("?") === -1) {
            url += "?";
          } else {
            url += "&";
          }

          const s = document.createElement("script");
          s.setAttribute("src", `${url + method}=${generatedFunction}`);
          document.getElementsByTagName("head")[0].appendChild(s);
        },

        /*
         * window.lodge.ajax.encodeForm(object form)
         * Takes a form object returned by a document.getElementBy... call
         * and turns it into a querystring to be used with a GET or POST call.
         */
        encodeForm(form) {
          if (typeof form !== "object") {
            return false;
          }
          let querystring = "";
          form = form.elements || form; // double check for elements node-list
          for (let i = 0; i < form.length; i++) {
            if (form[i].type === "checkbox" || form[i].type === "radio") {
              if (form[i].checked) {
                querystring += `${
                  (querystring.length ? "&" : "") + form[i].name
                }=${form[i].value}`;
              }
              // eslint-disable-next-line no-continue
              continue;
            }
            querystring += `${(querystring.length ? "&" : "") + form[i].name}=${
              form[i].value
            }`;
          }
          return encodeURI(querystring);
        },

        getHeaderForURL(url, header, callback) {
          const xhr = new XMLHttpRequest();
          xhr.open("HEAD", url);
          xhr.onreadystatechange = function doCallback() {
            if (this.readyState === this.DONE) {
              callback(this.getResponseHeader(header));
            }
          };
          xhr.send();
        },
      },

      /** *************************************************************************************
       *
       * window.lodge.events (object)
       * Add, remove, and fire events
       *
       * PUBLIC-ISH FUNCTIONS
       * window.lodge.events.fire(object obj, string type, object/any data)
       *
       ************************************************************************************** */

      // before the object let's map to standard HTML element event footprints
      addEventListener(eventName, callback) {
        const vv = window.lodge;
        vv.events.addListener(eventName, callback);
      },
      removeEventListener(eventName, callback) {
        const vv = window.lodge;
        vv.events.removeListener(eventName, callback);
      },
      dispatchEvent(e) {
        const vv = window.lodge;
        vv.events.dispatch(e);
      },

      events: {
        // added the fourth "target" parameter
        fire(obj, type, data, target, localonly) {
          const vv = window.lodge;
          if (target) {
            // target object found, so push to it via postMessage
            //
            // target should be an event object or a lodge embed object
            // target.origin and target.source should both be real
            // let's test and ensure we have the right thing
            if (typeof target === "string") {
              target = vv.embeds.getById(target);
            } else if (!target.source || !target.origin) {
              target = false;
            }
            if (target) {
              target.source.postMessage(
                JSON.stringify({
                  type,
                  data,
                }),
                target.origin
              );
            }
            // log it
            if (vv.debug.show) {
              if (!vv.loaded) {
                vv.debug.store(
                  `targeted ${target.id} with ${type} event.`,
                  data
                );
              } else {
                vv.debug.out(`targeted ${target.id} with ${type} event.`, data);
              }
            }
          } else {
            let e = null;
            // fire the event locally if not targeted
            if (document.dispatchEvent) {
              // standard
              e = document.createEvent("CustomEvent");
              e.initCustomEvent(type, false, false, data);
              if (vv.embedded && !localonly) {
                e.relay = true;
                e.source = window; // window
                e.origin = window.location.origin; // url
              }
              obj.dispatchEvent(e);
            } else {
              // dispatch for IE < 9
              e = document.createEventObject();
              e.detail = data;
              if (vv.embedded && !localonly) {
                e.relay = true;
                e.source = window; // window
                e.origin = window.location.origin; // url
              }
              obj.fireEvent(`on${type}`, e);
            }
            if (e.relay) {
              vv.events.relay(type, data);
            }
            // log it
            if (vv.debug.show) {
              let verb = "firing ";
              if (e.relay) {
                verb = "relaying ";
              }
              if (!vv.loaded) {
                vv.debug.store(`${verb + type} event.`, data);
              } else {
                vv.debug.out(`${verb + type} event.`, data);
              }
            }
          }
        },

        relay(type, data) {
          const vv = window.lodge;
          let targetOrigin = "*";
          if (vv.parent) {
            targetOrigin = vv.parent;
          }
          window.parent.postMessage(
            JSON.stringify({
              relay: true,
              type,
              data,
            }),
            targetOrigin
          );
        },

        addListener(eventName, callback) {
          const vv = window.lodge;
          // eslint-disable-next-line no-prototype-builtins
          if (!vv.eventlist.hasOwnProperty(eventName)) {
            vv.eventlist[eventName] = [];
          }
          vv.eventlist[eventName].push(callback);
        },

        removeListener(eventName, callback) {
          const vv = window.lodge;
          // eslint-disable-next-line no-prototype-builtins
          if (vv.eventlist.hasOwnProperty(eventName)) {
            const idx = vv.eventlist[eventName].indexOf(callback);
            if (idx !== -1) {
              vv.eventlist[eventName].splice(idx, 1);
            }
          }
        },

        dispatch(e) {
          const vv = window.lodge;
          // eslint-disable-next-line no-prototype-builtins
          if (vv.eventlist.hasOwnProperty(e.type)) {
            let i;
            for (i = 0; i < vv.eventlist[e.type].length; i++) {
              if (vv.eventlist[e.type][i]) {
                vv.eventlist[e.type][i](e);
              }
            }
          }
        },
      },

      /** *************************************************************************************
       *
       * window.lodge.measure (object)
       * Basic window/element measurements
       *
       * PUBLIC-ISH FUNCTIONS
       * window.lodge.measure.viewport()
       * window.lodge.measure.getClickPosition(event e)
       *
       ************************************************************************************** */
      measure: {
        viewport() {
          /*
						x: viewport width
						y: viewport height
					*/
          return {
            x: window.innerWidth || document.body.offsetWidth || 0,
            y: window.innerHeight || document.body.offsetHeight || 0,
          };
        },

        scrollheight() {
          // returns scrollable content height
          const db = document.body;
          const de = document.documentElement;
          return Math.max(
            db.scrollHeight,
            de.scrollHeight,
            db.offsetHeight,
            de.offsetHeight,
            db.clientHeight,
            de.clientHeight
          );
        },
      },

      /** *************************************************************************************
       *
       * window.lodge.validate (object)
       * check a string for format, mostly for form validation, etc.
       *
       * PUBLIC-ISH FUNCTIONS
       * window.lodge.validate.email()
       *
       ************************************************************************************** */
      validate: {
        email(address) {
          // hell no i didn't write this long, bonkers regex
          // thanks to: https://stackoverflow.com/a/46181
          // eslint-disable-next-line no-useless-escape
          const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return re.test(String(address).toLowerCase());
        },
      },

      /** *************************************************************************************
       *
       * window.lodge.overlay (object)
       * Building the actual lightbox bits
       *
       * PUBLIC-ISH FUNCTIONS
       * window.lodge.overlay.create(function callback)
       * window.lodge.overlay.hide()
       * window.lodge.overlay.reveal(string/object innerContent, string wrapClass)
       *
       ************************************************************************************** */
      overlay: {
        content: false,
        close: false,
        loadingContent: false,
        callbacks: [],

        setLoading({ loadString }) {
          const vv = window.lodge;
          vv.overlay.loadingContent = loadString.toString();
          if (vv.embedded) {
            vv.events.fire(vv, "overlaysetloading", {
              loadString: vv.overlay.loadingContent,
            });
          }
        },

        showLoading() {
          const vv = window.lodge;
          if (vv.overlay.loadingContent) {
            vv.overlay.reveal({ innerContent: vv.overlay.loadingContent });
          }
        },

        create(callback) {
          const vv = window.lodge;
          const self = vv.overlay;
          // const move = false;

          vv.styles.injectCSS({ css: `${vv.path}/templates/overlay.css` });

          self.content = document.createElement("div");
          self.content.className = "vv-overlay";

          self.close = document.createElement("div");
          self.close.className = "vv-close";

          window.addEventListener("keyup", function addKeyup(e) {
            if (e.keyCode === 27) {
              if (self.content.parentNode === document.body) {
                self.hide();
              }
            }
          });
          self.close.addEventListener("click", function addClick() {
            if (self.content.parentNode === document.body) {
              self.hide();
            }
          });
          /*
					self.bg.addEventListener('click', function(e) {
						if(e.target === this) {
							self.hide();
						}
					});
					*/
          if (typeof callback === "function") {
            callback();
          }
        },

        hide() {
          const vv = window.lodge;
          const self = vv.overlay;
          const db = document.body;
          if (vv.embedded) {
            vv.events.fire(vv, "overlayhide"); // request that the parent hides overlay
          } else {
            self.content.style.opacity = 0;
            vv.events.fire(vv, "overlayhidden", ""); // announce it's been hidden

            // self.content.innerHTML = '';
            while (self.content.firstChild) {
              self.content.removeChild(self.content.firstChild);
            }
            db.removeChild(self.close);
            db.removeChild(self.content);

            // reveal any (if) overlay triggers
            const t = document.querySelectorAll(".vv-overlaytrigger");
            if (t.length > 0) {
              for (let i = 0, len = t.length; i < len; i++) {
                t[i].style.visibility = "visible";
              }
            }

            // reenable body scrolling
            vv.styles.removeClass({
              el: document.documentElement,
              className: "vv-noscroll",
            });
          }
        },

        reveal({ innerContent, wrapClass = "vv-component" }) {
          // add the correct content to the content div
          const vv = window.lodge;
          const self = vv.overlay;
          const db = document.body;
          const positioning = document.createElement("div");
          const wrapper = document.createElement("div");
          if (vv.embedded) {
            // ask the parent to reveal overlay with contents
            vv.events.fire(vv, "overlayreveal", {
              innerContent,
              wrapClass,
            });
          } else {
            // if the overlay is already visible, kill the contents first
            if (self.content.style.opacity === 1) {
              self.content.innerHTML = "";
            }
            positioning.className = "vv-position";
            wrapper.className = wrapClass;

            if (typeof innerContent === "string") {
              wrapper.innerHTML = innerContent;
            } else {
              wrapper.appendChild(innerContent);
            }
            positioning.appendChild(wrapper);
            self.content.appendChild(positioning);

            // disable body scrolling
            if (!vv.styles.hasClass(document.documentElement, "vv-noscroll")) {
              vv.styles.addClass({
                el: document.documentElement,
                className: "vv-noscroll",
              });
            }

            // if not already showing, go!
            if (self.content.style.opacity !== 1) {
              self.content.style.opacity = 0;
              db.appendChild(self.content);
              db.appendChild(self.close);
              // force style refresh/redraw on element (dumb fix, older browsers)
              // eslint-disable-next-line no-unused-expressions
              window.getComputedStyle(self.content).opacity;
              // initiate fade-in
              self.content.style.opacity = 1;
              vv.events.fire(vv, "overlayrevealed", ""); // broadcast that it's revealed
            }
          }
        },

        addOverlayTrigger({ content, className, ref }) {
          const vv = window.lodge;
          // const self = vv.overlay;
          const db = document.body;
          if (vv.embedded) {
            vv.events.fire(vv, "addoverlaytrigger", {
              content,
              className,
              ref,
            });
          } else {
            const el = document.createElement("div");
            el.className = `${className.toString()} vv-overlaytrigger`;
            el.addEventListener("click", function addTrigger(e) {
              vv.overlay.reveal({ innerContent: content });
              this.style.visibility = "hidden";
              e.preventDefault();
              return false;
            });
            db.appendChild(el);
            vv.storage[ref] = el;
            vv.events.fire(vv, "triggeradded", ref);
          }
        },
      },

      /** *************************************************************************************
       *
       * window.lodge.styles (object)
       * Building the actual lightbox bits
       *
       * PUBLIC-ISH FUNCTIONS
       * window.lodge.styles.addClass(HTML element el, string classname)
       * window.lodge.styles.hasClass(HTML element el, string classname)
       * window.lodge.styles.injectCSS(string css, boolean important)
       * window.lodge.styles.removeClass(HTML element el, string classname)
       * window.lodge.styles.swapClasses(HTML element el, string oldclass, string newclass)
       *
       ************************************************************************************** */
      styles: {
        resolveElement(el) {
          if (typeof el === "string") {
            if (el.substr(0, 8) === "storage:") {
              return window.lodge.storage[el.substr(8)];
            }
            return document.querySelector(el);
          }
          return el;
        },

        addClass({ el, className, top }) {
          const vv = window.lodge;
          if (top && vv.embedded) {
            vv.events.fire(vv, "addclass", {
              el,
              className,
            });
          } else {
            el = vv.styles.resolveElement(el);
            if (el && !vv.styles.hasClass(el, className)) {
              el.className = `${el.className} ${className}`;
            }
          }
        },

        hasClass(el, className) {
          return ` ${el.className} `.indexOf(` ${className} `) > -1;
        },

        injectCSS({ css, important = false, top = false }) {
          const vv = window.lodge;
          let el;
          if (top && vv.embedded) {
            vv.events.fire(vv, "injectcss", {
              css,
              important,
            });
          } else {
            const head =
              document.getElementsByTagName("head")[0] ||
              document.documentElement;
            if (css.substr(0, 4) === "http") {
              // if css starts with "http" treat it as an external stylesheet
              el = document.createElement("link");
              el.rel = "stylesheet";
              el.href = css;
            } else {
              // without the "http" wrap css with a style tag
              el = document.createElement("style");
              el.innerHTML = css;
            }
            el.type = "text/css";

            if (important) {
              // important means we don't need to write !important all over the place
              // allows for overrides, etc
              head.appendChild(el);
            } else {
              // by injecting the css BEFORE any other style elements it means all
              // styles can be manually overridden with ease — no !important or similar,
              // no external files, etc...
              head.insertBefore(el, head.firstChild);
            }
          }
        },

        removeClass({ el, className, top }) {
          const vv = window.lodge;
          if (top && vv.embedded) {
            vv.events.fire(vv, "removeclass", {
              el,
              className,
            });
          } else {
            // extra spaces allow for consistent matching.
            // the "replace(/^\s+/, '').replace(/\s+$/, '')" stuff is because .trim() isn't supported on ie8
            el = vv.styles.resolveElement(el);
            if (el) {
              el.className = ` ${el.className} `
                .replace(` ${className} `, " ")
                .replace(/^\s+/, "")
                .replace(/\s+$/, "");
            }
          }
        },

        swapClasses({ el, oldClass, newClass, top }) {
          const vv = window.lodge;
          if (top && vv.embedded) {
            vv.events.fire(vv, "swapclasses", {
              el,
              oldClass,
              newClass,
            });
          } else {
            // add spaces to ensure we're not doing a partial find/replace,
            // trim off extra spaces before setting
            el = vv.styles.resolveElement(el);
            if (el) {
              el.className = ` ${el.className} `
                .replace(` ${oldClass} `, ` ${newClass} `)
                .replace(/^\s+/, "")
                .replace(/\s+$/, "");
            }
          }
        },
      },
    };

    const init = function init() {
      /*
       *	Post-definition (runtime) calls. For the _init() function to "auto" load...
       */

      // set path and get all script options
      // file location and path
      const s = document.querySelector('script[src$="lodge.js"]');
      if (s) {
        // chop off last 9 characters for '/lodge.js' -- not just a replace in case
        // a directory is actually named 'lodge.js'
        lodge.path = s.src.substr(0, s.src.length - 9);
      }
      // get and store options
      lodge.options = String(s.getAttribute("data-options"));

      const checkEmbeds = function checkEmbeds() {
        // check for element definition in script data-element
        const tags = document.querySelectorAll("embed.lodge");
        if (typeof tags === "object") {
          const t = Array.prototype.slice.call(tags);
          t.forEach(function check(el) {
            el.style.height = "1px";
            el.style.visibility = "hidden";
            const src = el.getAttribute("src");
            const alt = el.getAttribute("title");
            const css = el.getAttribute("data-css");
            const id = el.getAttribute("id");
            const modal = lodge.styles.hasClass({
              el,
              classname: "modal",
            });
            if (src) {
              lodge.embeds.create({
                src,
                alt,
                target: el,
                css,
                id,
                modal,
              });
            }
          });
        }
      };

      if (lodge.options.indexOf("lazy") !== -1) {
        // lazy mode...chill for a second
        setTimeout(function check() {
          lodge._init(lodge);
          checkEmbeds();
        }, 1000);
      } else {
        lodge._init(lodge);
        checkEmbeds();
      }
    };
    if (document.readyState === "loading") {
      // Loading hasn't finished yet
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init(); // `DOMContentLoaded` has already fired
    }

    // return the main object in case it's called into a different scope
    return lodge;
  })();
}
