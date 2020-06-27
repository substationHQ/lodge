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
      embeds: {
        whitelist: "",
        all: [],
      },
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
          vv.styles.addClass(document.documentElement, "vv-embed");
          vv._initEmbed();
        } else {
          vv.name = "main window";
        }

        // modal?
        if (vv.get.params.modal) {
          vv.styles.addClass(document.documentElement, "vv-modal");
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
        vv.events.add(window, "message", function addMessage(e) {
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
          vv.storage.elementQueue.forEach(function drawComponent(args) {
            // we stored the args in our queue...spit them back out
            vv.embed(args[0], args[1], args[2], args[3], args[4], args[5]);
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
          vv.styles.injectCSS(vv.get.params.cssoverride, true);
        }

        // resize to fit
        if (!vv.get.params.fixedsize) {
          vv.storage.embedheight = vv.measure.scrollheight(); // store current height
          vv.events.fire(vv, "resize", vv.storage.embedheight); // fire resize event immediately

          // poll for height and fire resize event if it changes
          window.setInterval(function resizeIframe() {
            const h = vv.measure.scrollheight();
            if (h !== vv.storage.embedheight) {
              vv.storage.embedheight = h;
              vv.events.fire(vv, "resize", h);
            }
          }, 250);
        }
      },

      _handleMessage(e) {
        const vv = window.lodge;
        let { source } = e; // source embed (if from an embed)
        const msg = JSON.parse(e.data);
        const md = msg.data;
        let lodgeMessage = true;
        try {
          // find the source of the message in our embeds object
          for (let i = 0; i < vv.embeds.all.length; i++) {
            if (vv.embeds.all[i].el.contentWindow === e.source) {
              if (!vv.embeds.all[i].el.source) {
                vv.embeds.all[i].source = e.source;
              }
              source = vv.embeds.all[i];
              break;
            }
          }
        } catch (ee) {
          lodgeMessage = false;
        }

        if (lodgeMessage) {
          // now figure out what to do with it
          switch (msg.type) {
            case "resize":
              source.el.height = md;
              source.el.style.height = `${md}px`; // resize to correct height
              break;
            case "checkoutdata":
              vv.events.fire(vv, "checkoutdata", md);
              break;
            case "overlayreveal":
              vv.overlay.reveal(md.innerContent, md.wrapClass);
              vv.events.fire(vv, "overlayopened", "");
              break;
            case "overlayhide":
              vv.overlay.hide();
              vv.events.fire(vv, "overlayhidden", "");
              break;
            case "addoverlaytrigger":
              vv.overlay.addOverlayTrigger(md.content, md.classname, md.ref);
              break;
            case "overlaysetloading":
              vv.overlay.setLoading(md);
              break;
            case "injectcss":
              vv.styles.injectCSS(md.css, md.important);
              break;
            case "addclass":
              vv.styles.addClass(md.el, md.classname);
              break;
            case "removeclass":
              vv.styles.removeClass(md.el, md.classname);
              break;
            case "swapclasses":
              vv.styles.swapClasses(md.el, md.oldclass, md.newclass);
              break;
            case "begincheckout":
              if (!vv.checkout) {
                vv.loadScript(
                  `${vv.path}/checkout/checkout.js`,
                  function beginCheckout() {
                    vv.checkout.begin(md);
                  }
                );
              } else {
                vv.checkout.begin(md);
              }
              break;
            default:
              if (msg.type !== "ready") {
                vv.events.fire(vv, msg.type, md, false, true);
              }
              break;
          }
        }
      },

      /*
       * contentloaded.js by Diego Perini (diego.perini at gmail.com)
       * http://javascript.nwbox.com/ContentLoaded/
       * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
       *
       * modified a little because you know
       */
      contentLoaded(fn) {
        const done = false;
        let top = true;
        const doc = window.document;
        const root = doc.documentElement;
        const init = function init(e) {
          if (e.type === "readystatechange" && doc.readyState !== "complete")
            return;
          lodge.events.remove(e.type === "load" ? window : doc, e.type, init);
          if (!done && done === true) fn.call(window, e.type || e);
        };
        const poll = function poll() {
          try {
            root.doScroll("left");
          } catch (e) {
            setTimeout(poll, 50);
            return;
          }
          init("poll");
        };

        if (doc.readyState === "complete") fn.call(window, "lazy");
        else {
          if (doc.createEventObject && root.doScroll) {
            try {
              top = !window.frameElement;
              // eslint-disable-next-line no-empty
            } catch (e) {}
            if (top) poll();
          }
          this.events.add(doc, "DOMContentLoaded", init);
          this.events.add(doc, "readystatechange", init);
          this.events.add(doc, "load", init);
        }
      },

      /*
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
       * contentLoaded because the partial load tells us where to embed each chunk — we find the
       * last script node and inject the content by it. For dynamic calls you need to specify
       * a targetNode to serve as the anchor — with the embed chucked immediately after that
       * element in the DOM.
       */
      embed(src, options, alt, targetNode, css, id, name) {
        const vv = window.lodge;

        // if used non-AJAX we just grab the current place in the doc
        // because we're running as the document is loading in a blocking fashion, the
        // last script element will be the current script asset.
        const allScripts = document.querySelectorAll("script");
        let currentNode = allScripts[allScripts.length - 1];
        if (!targetNode) {
          targetNode = currentNode;
        }

        if (!vv.loaded) {
          // cheap/fast queue waiting on load.
          if (typeof vv.storage.elementQueue !== "object") {
            vv.storage.elementQueue = [];
          }
          if (typeof src === "object") {
            if (!src.targetnode) {
              src.targetnode = currentNode;
              // eslint-disable-next-line prefer-rest-params
              arguments[0] = src;
            }
          } else {
            // eslint-disable-next-line prefer-rest-params
            arguments[3] = currentNode;
          }
          // eslint-disable-next-line prefer-rest-params
          vv.storage.elementQueue.push(arguments);
        } else {
          // Allow for a single object to be passed instead of all arguments
          // object properties should be lowercase versions of the standard arguments, any order
          if (typeof src === "object") {
            css = src.css ? src.css : false;
            options = src.options ? src.options : "";
            targetNode = src.targetnode ? src.targetnode : targetNode;
            alt = src.alt ? src.alt : false;
            id = src.id ? src.id : false;
            name = src.name ? src.name : false;
            src = src.src ? src.src : false;
          }
          if (typeof targetNode === "string") {
            // for AJAX, specify target node: '#id', '#id .class', etc. NEEDS to be specific
            currentNode = document.querySelector(targetNode);
          } else {
            currentNode = targetNode;
          }

          // make the iframe
          let modal = false;
          if (options.indexOf("modal") !== -1) {
            modal = true;
          }
          const iframe = vv.buildEmbedIframe(
            src,
            css,
            modal ? "modal=1" : false,
            id,
            name
          );

          // be nice neighbors. if we can't find currentNode, don't do the rest or pitch errors. silently fail.
          if (currentNode) {
            if (modal) {
              // create a span to contain the overlay link
              const embedNode = document.createElement("span");
              embedNode.className = "vv-modalopen";

              // open in a lightbox with a link in the target div
              if (!alt) {
                alt = "open";
              }
              vv.overlay.create(function addMarkup() {
                const a = document.createElement("a");
                a.href = "";
                a.target = "_blank";
                a.innerHTML = alt;
                embedNode.appendChild(a);
                currentNode.parentNode.insertBefore(embedNode, currentNode);
                (function addEvents() {
                  vv.events.add(a, "click", function showIframe(e) {
                    vv.overlay.reveal(iframe);
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

      buildEmbedIframe(src, cssoverride, querystring, id, name) {
        const vv = window.lodge;
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
        if (!name && id) {
          name = id;
        }
        if (name) {
          embedURL += `&name=${encodeURIComponent(name)}`;
        }
        /*
              // this passes the querystring from the parent to the embed. should think about 
              // security a bit more outside a platformed garden

              if (vv.get['params'] && (''+querystring).indexOf('modal=1') === -1) {
                if (vv.get['params']['element_id'] == id || vv.get['params']['handlequery']) {
                  embedURL += '&' + vv.get['qs'];
                }
              }
              */
        if (vv.debug.show) {
          embedURL += "&debug=1";
        }

        if (!id) {
          id = `vv-${new Date().getTime()}`;
        }

        const iframe = document.createElement("iframe");
        iframe.src = embedURL;
        iframe.id = id;
        iframe.className = "vv-embed";
        iframe.style.width = "100%";
        iframe.style.height = "0"; // if not explicitly set the scrollheight of the document will be wrong
        iframe.style.border = "0";
        iframe.style.overflow = "hidden"; // important for overlays, which flicker scrollbars on open
        iframe.scrolling = "no"; // programming

        let { origin } = window.location;
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

      getEmbedById(id) {
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
              vv.styles.injectCSS(`${vv.path}/templates/${templateName}.css`);
            }
          }
        }
      },

      /*
       *	Use standard event footprint
       */
      addEventListener(eventName, callback) {
        const vv = window.lodge;
        // eslint-disable-next-line no-prototype-builtins
        if (!vv.eventlist.hasOwnProperty(eventName)) {
          vv.eventlist[eventName] = [];
        }
        vv.eventlist[eventName].push(callback);
      },

      /*
       *	Use standard event footprint
       */
      removeEventListener(eventName, callback) {
        const vv = window.lodge;
        // eslint-disable-next-line no-prototype-builtins
        if (vv.eventlist.hasOwnProperty(eventName)) {
          const idx = vv.eventlist[eventName].indexOf(callback);
          if (idx !== -1) {
            vv.eventlist[eventName].splice(idx, 1);
          }
        }
      },

      /*
       *	Use standard event footprint
       */
      dispatchEvent(e) {
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
         * window.lodge.ajax.getXHR()
         * Tests for the proper XHR object type and returns the appropriate
         * object type for the current browser using a try/catch block. If
         * no viable objects are found it returns false. But we should make
         * fun of that browser, because it sucks.
         */
        getXHR() {
          try {
            // modern standard
            return new XMLHttpRequest();
          } catch (e) {
            try {
              // old dumb IE bullshit
              // eslint-disable-next-line no-undef
              return new ActiveXObject("Msxml2.XMLHTTP");
            } catch (er) {
              try {
                // older dumber IE bullshit
                // eslint-disable-next-line no-undef
                return new ActiveXObject("Microsoft.XMLHTTP");
              } catch (err) {
                return false;
              }
            }
          }
        },

        /*
         * window.lodge.ajax.send(string url, string postString, function successCallback)
         * Do a POST or GET request via XHR/AJAX. Passing a postString will
         * force a POST request, whereas passing false will send a GET.
         */
        send(url, postString, successCallback, failureCallback) {
          const method = "POST";
          const xhr = this.getXHR();
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
          const xhr = this.getXHR();
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
       * window.lodge.events.add(object obj, string type, function fn)
       * window.lodge.events.remove(object obj, string type, function fn)
       * window.lodge.events.fire(object obj, string type, object/any data)
       *
       ************************************************************************************** */
      events: {
        // Thanks, John Resig!
        // http://ejohn.org/blog/flexible-javascript-events/
        add(obj, type, fn) {
          if (obj.attachEvent) {
            obj[`e${type}${fn}`] = fn;
            obj[type + fn] = function addEvent() {
              obj[`e${type}${fn}`](window.event);
            };
            obj.attachEvent(`on${type}`, obj[type + fn]);
          } else {
            obj.addEventListener(type, fn, false);
          }
        },

        // Thanks, John Resig!
        // http://ejohn.org/blog/flexible-javascript-events/
        remove(obj, type, fn) {
          if (obj.detachEvent) {
            obj.detachEvent(`on${type}`, obj[type + fn]);
            obj[type + fn] = null;
          } else {
            obj.removeEventListener(type, fn, false);
          }
        },

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
              target = vv.getEmbedById(target);
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

        setLoading(loading) {
          const vv = window.lodge;
          vv.overlay.loadingContent = loading.toString();
          if (vv.embedded) {
            vv.events.fire(vv, "overlaysetloading", vv.overlay.loadingContent);
          }
        },

        showLoading() {
          const vv = window.lodge;
          if (vv.overlay.loadingContent) {
            vv.overlay.reveal(vv.overlay.loadingContent);
          }
        },

        create(callback) {
          const vv = window.lodge;
          const self = vv.overlay;
          // const move = false;

          vv.styles.injectCSS(`${vv.path}/templates/overlay.css`);

          self.content = document.createElement("div");
          self.content.className = "vv-overlay";

          self.close = document.createElement("div");
          self.close.className = "vv-close";

          vv.events.add(window, "keyup", function addKeyup(e) {
            if (e.keyCode === 27) {
              if (self.content.parentNode === document.body) {
                self.hide();
              }
            }
          });
          vv.events.add(self.close, "click", function addClick() {
            if (self.content.parentNode === document.body) {
              self.hide();
            }
          });
          /*
					vv.events.add(self.bg,'click', function(e) {
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
            vv.events.fire(vv, "overlayhide");
          } else {
            self.content.style.opacity = 0;
            vv.events.fire(vv, "overlayclosed", ""); // tell em

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
            vv.styles.removeClass(document.documentElement, "vv-noscroll");
          }
        },

        reveal(innerContent, wrapClass) {
          // add the correct content to the content div
          const vv = window.lodge;
          const self = vv.overlay;
          const db = document.body;
          if (vv.embedded) {
            vv.events.fire(vv, "overlayreveal", {
              innerContent,
              wrapClass,
            });
          } else {
            // if the overlay is already visible, kill the contents first
            if (self.content.style.opacity === 1) {
              self.content.innerHTML = "";
            }
            const positioning = document.createElement("div");
            positioning.className = "vv-position";
            const alert = document.createElement("div");
            if (wrapClass) {
              alert.className = wrapClass;
            } else {
              alert.className = "vv-element";
            }
            if (typeof innerContent === "string") {
              alert.innerHTML = innerContent;
            } else if (innerContent.endpoint && innerContent.element) {
              // make the iframe
              // const s = "";
              const iframe = vv.buildEmbedIframe(
                innerContent.src,
                false,
                "modal=1"
              );
              alert.appendChild(iframe);
            } else {
              alert.appendChild(innerContent);
            }
            positioning.appendChild(alert);
            self.content.appendChild(positioning);

            // disable body scrolling
            if (!vv.styles.hasClass(document.documentElement, "vv-noscroll")) {
              vv.styles.addClass(document.documentElement, "vv-noscroll");
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
            }
          }
        },

        addOverlayTrigger(content, classname, ref) {
          const vv = window.lodge;
          // const self = vv.overlay;
          const db = document.body;
          if (vv.embedded) {
            vv.events.fire(vv, "addoverlaytrigger", {
              content,
              classname,
              ref,
            });
          } else {
            const el = document.createElement("div");
            el.className = `${classname.toString()} vv-overlaytrigger`;
            vv.events.add(el, "click", function addTrigger(e) {
              vv.overlay.reveal(content);
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

        addClass(el, classname, top) {
          const vv = window.lodge;
          if (top && vv.embedded) {
            vv.events.fire(vv, "addclass", {
              el,
              classname,
            });
          } else {
            el = vv.styles.resolveElement(el);
            if (el && !vv.styles.hasClass(el, classname)) {
              el.className = `${el.className} ${classname}`;
            }
          }
        },

        hasClass(el, classname) {
          // borrowed the idea from http://stackoverflow.com/a/5898748/1964808
          return ` ${el.className} `.indexOf(` ${classname} `) > -1;
        },

        injectCSS(css, important, mainwindow) {
          if (mainwindow === undefined) {
            mainwindow = false;
          }
          const vv = window.lodge;
          let el;
          if (mainwindow && vv.embedded) {
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

        removeClass(el, classname, top) {
          const vv = window.lodge;
          if (top && vv.embedded) {
            vv.events.fire(vv, "removeclass", {
              el,
              classname,
            });
          } else {
            // extra spaces allow for consistent matching.
            // the "replace(/^\s+/, '').replace(/\s+$/, '')" stuff is because .trim() isn't supported on ie8
            el = vv.styles.resolveElement(el);
            if (el) {
              el.className = ` ${el.className} `
                .replace(` ${classname} `, " ")
                .replace(/^\s+/, "")
                .replace(/\s+$/, "");
            }
          }
        },

        swapClasses(el, oldclass, newclass, top) {
          const vv = window.lodge;
          if (top && vv.embedded) {
            vv.events.fire(vv, "swapclasses", {
              el,
              oldclass,
              newclass,
            });
          } else {
            // add spaces to ensure we're not doing a partial find/replace,
            // trim off extra spaces before setting
            el = vv.styles.resolveElement(el);
            if (el) {
              el.className = ` ${el.className} `
                .replace(` ${oldclass} `, ` ${newclass} `)
                .replace(/^\s+/, "")
                .replace(/\s+$/, "");
            }
          }
        },
      },
    };

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
        t.forEach(function check(e) {
          e.style.height = "1px";
          e.style.visibility = "hidden";
          const css = e.getAttribute("data-css");
          const opt = e.getAttribute("data-options");
          const src = e.getAttribute("src");
          const alt = e.getAttribute("title");
          const id = e.getAttribute("id");
          const name = e.getAttribute("name");
          if (src) {
            lodge.embed({
              css,
              options: opt,
              src,
              targetnode: e,
              alt,
              id,
              name,
            });
          }
        });
      }
    };

    const init = function init() {
      // function traps lodge in a closure
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
    lodge.contentLoaded(init); // loads only after the page is complete

    /*
     *	return the main object in case it's called into a different scope
     */
    return lodge;
  })();
}
