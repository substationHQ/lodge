/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-underscore-dangle */

/** *************************************************************************************
 *
 * △△ lodge
 * @version 1.0
 *
 * @link http://lodge.glitch.me/
 *
 * @license MIT
 * Copyright (c) 2021, Substation
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
 ************************************************************************************** */

// Only run the init() script (end of function) if lodge hasn't already been created.
if (!window.lodge) {
  /** *************************************************************************************
   *
   * △△ lodge {object}
   * Everything we need to create embed iframes
   *
   ************************************************************************************** */
  window.lodge = (function lodge() {
    // eslint-disable-next-line no-shadow
    const lodge = {
      embedded: false,
      eventlist: {},
      get: {},
      lightbox: false,
      loaded: false,
      id: "",
      options: "",
      parent: "",
      path: "",
      scripts: [],
      storage: {},
      templates: {},

      /**
       * /// lodge._constructor()
       * Runs a few checks, finds embeds, sets up lodge object parameters and defaults.
       *
       ********************************************************************************** */
      // eslint-disable-next-line consistent-return
      _constructor() {
        const vv = window.lodge;

        // set path and get all script options
        // file location and path
        const script = document.querySelector('script[src$="lodge.js"]');
        if (script) {
          // chop off last 9 characters for '/lodge.js' -- not just a replace in case
          // a directory is actually named 'lodge.js'
          vv.path = script.src.substr(0, script.src.length - 9);
          // get and store options
          try {
            lodge.options = JSON.parse(
              `{"${script
                .getAttribute("data-options")
                .replace(/&/g, '","')
                .replace(/=/g, '":"')}"}`
            );
          } catch (error) {
            lodge.options = "error";
          }
        }

        // find all <embed> tags with the lodge class (embed.lodge) and process them
        vv._findEmbeds();

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

        // enable debug if requested
        if (vv.get.params.debug) {
          vv.debug.show = true;
        }

        // if we're running in an iframe assume it's an embed (won't do any harm if not)
        if (self !== top) {
          // first check for noembed. if we find it AND we're in an iframe die immediately
          if (vv.options.noembed) {
            return false;
          }
          vv.styles.addClass({
            el: document.documentElement,
            className: "lodge__embed",
          });
          vv._initEmbed();
        } else {
          vv.id = "lodge main";
        }

        // check for ?overlay=1, added when we create an overlay iframe
        // if found add a class to the main doc for styling.
        if (vv.get.params.overlay) {
          vv.styles.addClass({
            el: document.documentElement,
            className: "lodge__embed--overlay",
          });
        }

        // check lightbox options
        const imgTest = document.querySelectorAll(
          "a.lodge.gallery,div.lodge.gallery"
        );
        if (vv.options.lightboxvideo || imgTest.length > 0) {
          // load lightbox.js
          vv.getScript({ url: `${vv.path}/lightbox/lightbox.js` });
        }

        // using messages passed between the request and this script to resize the iframe
        window.addEventListener("message", function addMessage(e) {
          // make sure the message comes from our embeds OR the main embedding lodge.js instance (via origin allowed)
          if (vv.embeds.allowed.indexOf(e.origin) !== -1) {
            vv._handleMessage(e);
          }
        });

        // add current domain to allowed for postmessage calls (regardless of embed or no)
        vv.embeds.allowed += window.location.href
          .split("/")
          .slice(0, 3)
          .join("/");
        if (vv.get.params.location) {
          vv.embeds.allowed += vv.get.params.location
            .split("/")
            .slice(0, 3)
            .join("/");
        }

        if (!vv.embedded) {
          // create overlay stuff first
          vv.overlay.create();
        }
        vv.loaded = Date.now(); // ready and loaded
        // eslint-disable-next-line no-underscore-dangle
        vv._drawQueuedEmbeds();
        // log it
        vv.debug.out({ message: "finished initializing", obj: vv });
        // tell em
        vv.events.fire({ obj: vv, type: "ready", data: vv.loaded });
      },

      /**
       * /// lodge._findEmbeds()
       * Looks for embed.lodge <embed> tags and passes them to embeds.create()
       *
       ********************************************************************************** */
      // eslint-disable-next-line consistent-return
      _findEmbeds() {
        // check for element definition in script data-element
        const tags = document.querySelectorAll("embed.lodge");
        if (typeof tags === "object") {
          const t = Array.prototype.slice.call(tags);
          t.forEach(function createFrom(el) {
            el.style.height = "1px";
            el.style.visibility = "hidden";
            const src = el.getAttribute("src");
            const alt = el.getAttribute("title");
            const css = el.getAttribute("data-css");
            const id = el.getAttribute("id");
            const overlay = lodge.styles.hasClass({
              el,
              className: "overlay",
            });
            const forwardquery = lodge.styles.hasClass({
              el,
              className: "forwardquery",
            });
            if (src) {
              lodge.embeds.create({
                src,
                alt,
                target: el,
                css,
                id,
                overlay,
                forwardquery,
              });
            }
          });
        }
      },

      /**
       * /// lodge._drawQueuedEmbeds()
       * If embeds.create() is run before lodge is fully loaded (as it is in _findEmbeds())
       * it queues embeds to be passed to embeds.create() — _drawQueuedEmbeds() finishes
       * the job if needed.
       *
       ********************************************************************************** */
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

      /**
       * /// lodge._initEmbed()
       * Called when lodge figures out it's running as an embed rather than in the main
       * window. Sets a few parameters and CSS classes, mesures itself for iframe height
       * and identifies itself before reporting back up to the main window.
       *
       ********************************************************************************** */
      _initEmbed() {
        const vv = window.lodge;
        vv.embedded = true; // set this as an embed

        if (vv.get.params.lodgelocation) {
          vv.parent = vv.get.params.lodgelocation;
          vv.embeds.allowed = `${vv.embeds.allowed},${vv.parent}`;
        }

        if (vv.get.params.id) {
          vv.id = vv.get.params.id;
        } else {
          vv.id = window.location.href;
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
          vv.events.fire({
            obj: vv,
            type: "resize",
            data: { height: vv.storage.embedheight },
          }); // fire resize event immediately

          // poll for height and fire resize event if it changes
          window.setInterval(function resizeIframe() {
            const h = vv.measure.scrollheight();
            if (h !== vv.storage.embedheight) {
              vv.storage.embedheight = h;
              vv.events.fire({ obj: vv, type: "resize", data: { height: h } });
            }
          }, 125);
        }
      },

      /**
       * /// lodge._handleMessage()
       * Takes message type and data, either handling them with a predefined internal
       * function or firing an event that an external script can listen for and react to.
       *
       * @param {object} msg - The message event to be parsed.
       *
       ********************************************************************************** */
      _handleMessage(msg) {
        const vv = window.lodge;
        const message = JSON.parse(msg.data);
        const routing = {
          /*
          we'll pass message.data to the handler for each route. requre a script to 
          load/verify it before firing the handler. (in an ideal world these would nest 
          indefinitely, but it's not worth the extra array/reduce load. just a function 
          name at the root of lodge or one object deep. [function] OR [object.function])

          a required lodge script module can be defined, and the handler will be called
          as a callback once that's loaded.
          */
          addclass: { handler: "styles.addClass" },
          begincheckout: {
            handler: "checkout.begin",
            require: "checkout/checkout.js",
          },
          injectcss: { handler: "styles.injectCSS" },
          overlayhide: { handler: "overlay.hide" },
          overlayreveal: { handler: "overlay.reveal" },
          overlaysetloading: { handler: "overlay.setLoading" },
          removeclass: { handler: "styles.removeClass" },
          resize: { handler: "embeds.resize" },
          swapclasses: { handler: "styles.swapClasses" },
        };
        let lodgeMessage = false;

        if (vv.embedded && window.parent === msg.source) {
          // we're in an embed, so if the message came from the parent it's cool
          lodgeMessage = true;
        } else {
          // not an embed? find the source of the message in our embeds object
          for (let i = 0; i < vv.embeds.all.length; i++) {
            if (vv.embeds.all[i].el.contentWindow === msg.source) {
              lodgeMessage = true;
              if (!vv.embeds.all[i].el.source) {
                vv.embeds.all[i].source = msg.source;
              }
              message.data._source = vv.embeds.all[i];
              break;
            }
          }
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
              // (if script is already loaded, getScript will check and immediately do callback)
              vv.getScript({
                url: `${vv.path}/${routing[message.type].require}`,
                callback: function beginCheckout() {
                  route[handlerFunction](message.data);
                },
              });
            }
          } else if (message.type !== "ready") {
            // for anything else, we fire the event through the stack of embeds
            // (we do NOT fire for "ready" because we don't want to falsely trigger ready events)
            vv.events.fire({
              obj: vv,
              type: message.type,
              data: message.data,
              target: false,
              localonly: true,
            });
          }
        }
      },

      /**
       * /// lodge.getTemplate()
       * Loads a view template and coressponding CSS from the templates folder.
       *
       * @param {object} template
       * @param {string} template.templateName - The name of the template as it appears in the templates/ folder (minus the ".js").
       * @param {function} template.successCallback - A callback function that will fire after the template has been fully loaded.
       * @param {boolean} [template.loadCSS=true] - Should we look for and load the matching CSS file?
       *
       ********************************************************************************** */
      getTemplate({ templateName, successCallback, loadCSS = true }) {
        const vv = window.lodge;
        const { templates } = vv;
        if (templates[templateName] !== undefined) {
          successCallback(templates[templateName]);
        } else {
          // get the template
          this.ajax.jsonp({
            url: `${vv.path}/templates/${templateName}.js`,
            callback: function templateLoaded(json) {
              templates[templateName] = json.template;
              successCallback(json.template);
            },
            remoteCallback: `_${templateName}Callback`,
          });

          if (loadCSS) {
            // check for existence of the CSS file and if not found, include it
            const test = document.querySelectorAll(
              `link[href="${vv.path}/templates/${templateName}.css"]`
            );
            if (!test.length) {
              // if found
              vv.styles.injectCSS({
                css: `${vv.path}/templates/${templateName}.css`,
              });
            }
          }
        }
      },

      /**
       * /// lodge.getScript()
       * Largely lifted from jQuery, this function loads an external script into the DOM.
       * Lodge uses it primarily to load sub-modules — since they're same-origin we can
       * load them safely.
       *
       * @param {string} url - The script location.
       * @param {function} successCallback - A callback function that will fire after the script has been fully loaded.
       *
       ********************************************************************************** */
      getScript({ url, callback }) {
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
        vv.debug.out({ message: `loaded script: ${url}` });
      },

      /** *************************************************************************************
       *
       * /// lodge.embeds {object}
       * Everything we need to create embed iframes
       *
       ************************************************************************************** */
      embeds: {
        allowed: "",
        all: [],

        /**
         * /// lodge.embeds.create
         * Formats and injects an iframe into the DOM
         *
         * @param {object} component
         * @param {string} component.src - The URL or relative link for the iframe source.
         * @param {string} [component.alt=open] - Taken from an embed's title parameter, this is used as link text for opening a modal component.
         * @param {object|string} component.target - A target DOM element used for location of the embed or open link (for modal components.) If a string is passed rather than a true DOM element it will be tested with queryselector.
         * @param {string} [component.css] - CSS override passed to the iframe, expecting a lodge-powered component.
         * @param {string} component.id - Taken from the embed id, this id will be used for the new iframe. The embed tag will be removed from the DOM, removing conflict.
         * @param {boolean} [component.overlay=false] - Open the component in an overlay, generating an open link in place of the embed element.
         * @param {boolean} [component.forwardquery=false] - If true, all current querystring parameters are passed to the underlying embed's iframe.
         *
         ************************************************************************************ */
        create({
          src,
          alt = "open",
          target,
          css,
          id,
          overlay = false,
          forwardquery = false,
        }) {
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
              overlay,
              forwardquery,
            });
          } else {
            if (typeof targetNode === "string") {
              // for AJAX, specify target node: '#id', '#id .class', etc. NEEDS to be specific
              currentNode = document.querySelector(target);
            } else {
              currentNode = target;
            }

            // be nice neighbors. if we can't find currentNode, don't do the rest or pitch errors. silently fail.
            if (currentNode) {
              const iframeParams = {
                src,
                css,
                overlay,
                id,
                forwardquery,
              };

              if (overlay) {
                // create a span to contain the overlay link
                const embedNode = document.createElement("span");
                embedNode.className = "lodge__overlay-open";

                // open in an overlay with a link in the target div
                vv.overlay.create(function addMarkup() {
                  const a = document.createElement("a");
                  a.href = "";
                  a.target = "_blank";
                  a.innerHTML = alt;
                  embedNode.appendChild(a);
                  currentNode.parentNode.insertBefore(embedNode, currentNode);
                  (function addEvents() {
                    a.addEventListener("click", function showIframe(e) {
                      vv.overlay.reveal({
                        innerContent: iframeParams,
                        embedRequest: true,
                      });
                      e.preventDefault();
                    });
                  })();
                });
              } else {
                // set up the iframe
                const iframe = vv.embeds.buildIframe(iframeParams);
                // put the iframe in place
                currentNode.parentNode.insertBefore(iframe, currentNode);
              }

              if (currentNode.tagName === "EMBED") {
                currentNode.parentNode.removeChild(currentNode);
              }
            }
          }
        },

        /**
         * /// lodge.embeds.buildIframe
         * Builds the actual iframe DOM element for the embed, setting classes and query
         * strings that will tell the embed's lodge instance more about expectations for it.
         *
         * @param {object} component
         * @param {string} component.src - The URL or relative link for the iframe source.
         * @param {string} [component.css] - CSS override passed to the iframe via querystring.
         * @param {string} component.id - Taken from the embed id, this id will be used for the new iframe.
         * @param {boolean} [component.overlay=false] - If true, a modal flag is set to tell the underlying iframe's lodge instance it's correctly running as a modal embed.
         * @param {boolean} [component.forwardquery=false] - If true, all current querystring parameters are passed to the underlying embed's iframe.
         *
         * @returns {object} iframe
         *
         ************************************************************************************ */
        buildIframe({ src, css, overlay, id, forwardquery = false }) {
          const vv = window.lodge;
          const iframe = document.createElement("iframe");
          let embedURL = src;

          const originlocation = encodeURIComponent(
            `${location.protocol}//${location.hostname}${
              location.port ? `:${location.port}` : ""
            }`
          );
          if (!id) {
            id = `lodge__${new Date().getTime()}`;
          }
          embedURL += `?lodgelocation=${originlocation}&id=${id}`;
          if (css) {
            embedURL += `&cssoverride=${encodeURIComponent(css)}`;
          }
          if (forwardquery) {
            embedURL += `&${vv.get.qs}`;
          }
          if (overlay) {
            embedURL += "&overlay=1";
          }
          if (vv.debug.show) {
            embedURL += `&debug=true`;
          }

          iframe.src = embedURL;
          iframe.id = id;
          iframe.className = "lodge__embed";
          iframe.style.width = "100%";
          iframe.style.height = "0"; // if not explicitly set the scrollheight of the document will be wrong
          iframe.style.border = "0";
          iframe.style.overflow = "hidden"; // important for overlays, which flicker scrollbars on open
          iframe.style.display = "block";
          iframe.scrolling = "no"; // programming

          let origin = window.location;
          if (embedURL.includes("://")) {
            origin = embedURL.split("/").slice(0, 3).join("/");
            if (vv.embeds.allowed.indexOf(origin) === -1) {
              vv.embeds.allowed += `,${origin}`;
            }
          }
          vv.embeds.all.push({
            id,
            el: iframe,
            src,
            source: null,
            origin,
          });
          vv.debug.out({ message: `building iframe for ${id}` });

          return iframe;
        },

        /**
         * /// lodge.embeds.resize
         * Resizes an iframe's height to match the height from a resize event. This is
         * handled over event relays from inside the embed (measuring scrollheight) and
         * passed up to the main window which then calls resize to set the height of the
         * corresponding iframe, making sure there are no scrollbars.
         *
         * @param {object} request
         * @param {object} request._source - Added automatically to message.data by lodge._handleMessage, the _source param specifies the source of the original message/request.
         * @param {number} request.height - The scroll height, in pixels, of the iframe's content.
         *
         ************************************************************************************ */
        resize({ _source, height }) {
          const embed = _source.el;
          embed.height = height;
          embed.style.height = `${height}px`; // resize to correct height
        },

        /**
         * /// lodge.embeds.getById
         * Uses a lodge internal id to specify and find a specific embed for targeting.
         *
         * @param {string} id - The id of the embed to be returned.
         *
         * @returns {object} embed
         *
         ************************************************************************************ */
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
      }, /// END lodge.embeds

      /** *************************************************************************************
       *
       * /// lodge.debug {object}
       * Outputs messages and object details to the dev console.
       *
       ************************************************************************************** */
      debug: {
        show: false, // debug flag set in _constructor by detecting a ?debug=true querystring

        /**
         * /// lodge.debug.store
         * Stores debug messages in a queue to be processed later. Used for messages that are
         * sent beore lodge is fully loaded, or for grouped messages.
         *
         * @param {object} debug
         * @param {object} debug.message - The message to output to the console.
         * @param {object} debug.obj - An object attachment that will be output along with the message. Allows for more in-depth debugging.
         *
         ************************************************************************************ */
        store({ message, obj }) {
          // making a debug message queue
          const vv = window.lodge;
          if (!vv.storage.debug) {
            vv.storage.debug = [];
          }
          vv.storage.debug.push({ message, obj });
        },

        /**
         * /// lodge.debug.out
         * Outputs debug messages or message groups to the dev console.
         *
         * @param {object} debug
         * @param {object} debug.message - The message to output to the console.
         * @param {object} debug.obj - An object attachment that will be output along with the message. Allows for more in-depth debugging.
         *
         ************************************************************************************ */
        out({ message, obj }) {
          const vv = window.lodge;

          // if debug is off just skip all this when called
          // checking here means we can just call out any time without checks
          if (vv.debug.show) {
            if (!vv.loaded) {
              // not ready? store and exit
              vv.debug.store({ message, obj });
              return;
            }

            const styles = {
              main: {
                logo: "color:#093;font-weight:bold;",
                name: "color:#093;font-weight:bold;",
                message: "font-weight:normal;",
              },
              embed: {
                logo: "color:#69f;font-weight:bold;",
                name: "color:#69f;font-weight:bold;",
                message: "font-weight:normal;",
              },
            };
            let type = "main";
            let icon = "△△";
            if (vv.embedded) {
              type = "embed";
              icon = "▽▽";
            }

            if (!vv.storage.debug) {
              // no queue: just spit out the message and (optionally) object
              if (obj) {
                console.log(
                  `%c${icon}%c ${vv.id}:%c\n   ${message} %O`,
                  styles[type].logo,
                  styles[type].name,
                  styles[type].message,
                  obj
                );
              } else {
                console.log(
                  `%c${icon}%c ${vv.id}:%c\n   ${message}`,
                  styles[type].logo,
                  styles[type].name,
                  styles[type].message
                );
              }
            } else {
              // queue: run through all of it as part of a collapsed group
              console.groupCollapsed(
                `%c${icon}%c ${vv.id}:%c\n   ${message}`,
                styles[type].logo,
                styles[type].name,
                styles[type].message
              );
              if (obj) {
                console.log("   attachment: %O", obj);
              }
              vv.storage.debug.forEach(function logMessages(queued) {
                if (queued.o) {
                  console.log(`   ${queued.message} %O`, queued.obj);
                } else {
                  console.log(`   ${queued.message}`);
                }
              });
              console.groupEnd();
              // now clear the debug queue
              delete vv.storage.debug;
            }
          }
        },
      }, /// END lodge.debug

      /** *************************************************************************************
       *
       * /// lodge.ajax {object}
       * Object wrapping XHR and JSONP calls. Also provides form encoding for POST forms.
       *
       ************************************************************************************** */
      ajax: {
        /**
         * /// lodge.ajax.send
         * Sends a GET or POST request with the response sent to success or failure callback
         * functions. Passing a postString will force a POST request. Omitting it will result
         * in a GET request.
         *
         * @param {object} xhr
         * @param {string} xhr.url - The endpoint where we're sending our request.
         * @param {string} xhr.postString - A POST string (value=1&other=2) from an encoded form that will be sent with the request.
         * @param {function} xhr.callback - A callback function called with results, using (err, result) footprint
         *
         ************************************************************************************ */
        send({ url, postString = null, callback }) {
          let method = "POST";
          if (!postString) {
            method = "GET";
          }
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
            if (typeof callback === "function") {
              xhr.onreadystatechange = function doCallback() {
                if (xhr.readyState === 4) {
                  if (xhr.status >= 200 && xhr.status <= 299) {
                    callback(null, xhr.responseText);
                  } else {
                    // testing typof to ensure we've got a callback to call
                    callback({ error: xhr.responseText }, null);
                  }
                }
              };
            }
            xhr.send(postString);
          }
        },

        /**
         * /// lodge.ajax.jsonp
         * Does a JSONP request for a remote script, which we use primarily to load templates
         * stored in JSON as scripts we can then use in lodge.
         *
         * Boiled down from https://github.com/OscarGodson/JSONP/blob/master/JSONP.js
         *
         * @param {object} jsonp
         * @param {string} jsonp.url - The script URL to be called.
         * @param {function} jsonp.callback - Our callback function that takes the resulting JSON as an argument.
         * @param {string} jsonp.remoteCallback - The name of the remote callback function.
         *
         ************************************************************************************ */
        jsonp({ url, callback, remoteCallback = "callback" }) {
          // callback wrapper is a basic function we define as a global under the window object.
          // it waits to be called by the injected JSONP script and then deletes itself.
          window[remoteCallback] = function wrapper(json) {
            callback(json);
            delete window[remoteCallback];
          };

          // create a script node and reference the remote callback and local callback
          const s = document.createElement("script");
          s.setAttribute("src", url);
          // add the script node to the DOM
          document.getElementsByTagName("head")[0].appendChild(s);
        },

        /**
         * /// lodge.ajax.encodeForm
         * Takes a form element and *LIKE MAGIC* turns it into a query string. Like magic.
         *
         * @param {object} form
         *
         ************************************************************************************ */
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
      }, /// END lodge.ajax

      /** *************************************************************************************
       *
       * /// lodge.events {object}
       * Give standard .addEventListener footprint to object, fire and relay events through
       * the chain of embeds
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
        /**
         * /// lodge.events.fire
         * Trigger a specific custom event, target it to a specific embed, or use it
         * specifically as a locals-only event.
         *
         * @param {object} event
         * @param {object} event.obj - The object that will own and fire the event. Event listeners should be tageting this object.
         * @param {string} event.type - The name of the event.
         * @param {object|any} [event.data] - The data attached to the event itself. For internal lodge purposes this should be formatted as an object, but for external scripts any data type, including none, is fine.
         * @param {object|string} [event.target] - A lodge-powered iframe embed, specified either by an internal lodge id or with a direct pointer.
         * @param {boolean} [event.echoTarget] - Used for an event that happens in the main window / overlay with a targeted embed. Set to true, it will fire the same event simultaneously in the main window and embed.
         * @param {boolean} [event.localonly] - If called in an embed, do not bubble this event up to the main window.
         *
         ************************************************************************************ */
        fire({
          obj,
          type,
          data = "",
          target,
          echoTarget = false,
          localonly = false,
        }) {
          const vv = window.lodge;
          let relay = true;
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
            vv.debug.out({
              message: `targeted ${target.id} with ${type} event.`,
              obj: data,
            });
            // set relay to false, since we've already targeted the embed.
            // this suppresses the usual relay default.
            relay = false;
          }
          if (!target || (target && echoTarget)) {
            let e = null;
            // fire the event locally if not targeted
            // standard
            e = document.createEvent("CustomEvent");
            e.initCustomEvent(type, false, false, data);
            if (vv.embedded && !localonly) {
              e.relay = relay;
              e.source = window; // window
              e.origin = window.location.origin; // url
            }
            obj.dispatchEvent(e);
            if (e.relay) {
              vv.events.relay({ type, data });
            }
            // log it
            let verb = "firing ";
            if (e.relay) {
              verb = "relaying ";
            }
            vv.debug.out({ message: `${verb + type} event.`, obj: data });
          }
        },

        /**
         * /// lodge.events.relay
         * Relay an event, via postMessage, up to the main window.
         *
         * @param {object} event
         * @param {string} event.type - The name of the event.
         * @param {object|any} [event.data] - The data attached to the event itself.
         *
         ************************************************************************************ */
        relay({ type, data }) {
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

        /**
         * /// lodge.events.addListener
         * Providing standard event listener add/remove/dispatch footprints for window.lodge
         *
         * @param {string} eventName - The name of the event.
         * @param {function} callback - A callback function.
         *
         ************************************************************************************ */
        addListener(eventName, callback) {
          const vv = window.lodge;
          // eslint-disable-next-line no-prototype-builtins
          if (!vv.eventlist.hasOwnProperty(eventName)) {
            vv.eventlist[eventName] = [];
          }
          vv.eventlist[eventName].push(callback);
        },

        /**
         * /// lodge.events.addListener
         * Providing standard event listener add/remove/dispatch footprints for window.lodge
         *
         * @param {string} eventName - The name of the event.
         * @param {function} callback - A callback function.
         *
         ************************************************************************************ */
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

        /**
         * /// lodge.events.addListener
         * Providing standard event listener add/remove/dispatch footprints for window.lodge
         *
         * @param {object} e - The event to dispatch.
         *
         ************************************************************************************ */
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
      }, /// END lodge.events

      /** *************************************************************************************
       *
       * /// lodge.measure {object}
       * Basic window/element measurements
       *
       ************************************************************************************** */
      measure: {
        /**
         * /// lodge.measure.viewport
         * Measures width and height for the current viewport size.
         *
         * @returns {object} Sets return.x to width (px) and return.y to height (px)
         *
         ************************************************************************************ */
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

        /**
         * /// lodge.measure.scrollheight
         * Measures The total scroll height of the current window. Used in resizing iframes
         * to make sure we don't show scrollbars, and takes the largest value of all the
         * variou ways different browsers measure height.
         *
         * @returns {number} height in px
         *
         ************************************************************************************ */
        scrollheight() {
          // returns scrollable content height
          const db = document.body;
          const de = document.documentElement;
          return Math.max(
            db.scrollHeight,
            // de.scrollHeight, // <--- doesn't resize *down* ever, only in here as IE support
            db.offsetHeight,
            de.offsetHeight,
            db.clientHeight
            // de.clientHeight //  <--- doesn't resize *down* ever, only in here as IE support
          );
        },
      }, /// END lodge.measure

      /** *************************************************************************************
       *
       * /// lodge.validate {object}
       * Email validation, but placeholder object for future needs
       *
       ************************************************************************************** */
      validate: {
        /**
         * /// lodge.validate.email
         * Validates a string against a holy shit level regex to check if it's a valid email
         * address. Who knows what's in that black magic.
         *
         * @param {string} email - The email address to test.
         *
         * @returns {boolean} valid or no
         *
         ************************************************************************************ */
        email(address) {
          // hell no i didn't write this long, bonkers regex
          // thanks to: https://stackoverflow.com/a/46181
          // eslint-disable-next-line no-useless-escape
          const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return re.test(String(address).toLowerCase());
        },
      }, /// END lodge.validate

      /** *************************************************************************************
       *
       * /// lodge.overlay {object}
       * Build, modify, hide, or reveal a consistent modal overlay in the main window and give
       * all lodge embeds access to it.
       *
       ************************************************************************************** */
      overlay: {
        content: false,
        close: false,
        loadingContent: false,
        callbacks: [],

        /**
         * /// lodge.overlay.setLoading
         * Sets a string (can contain markup) for the loading screen of the overlay. Note:
         * because this is often called via embed event postMessage the loadString parameter
         * exists in a deconstructed object even though it is a single parameter. This makes
         * it easier to pass the event data object straight to this function.
         *
         * @param {object} overlay
         * @param {string} overlay.loadString - The content string for the loading state.
         *
         ************************************************************************************ */
        setLoading({ loadString }) {
          const vv = window.lodge;
          vv.overlay.loadingContent = loadString.toString();
          if (vv.embedded) {
            vv.events.fire({
              obj: vv,
              type: "overlaysetloading",
              data: {
                loadString: vv.overlay.loadingContent,
              },
            });
          }
        },

        /**
         * /// lodge.overlay.showLoading
         * Displays the loading screen for the overlay. This can be triggered to show a
         * progress indicator as a component loads templates or if there's an extended action
         * like an API call.
         *
         ************************************************************************************ */
        showLoading() {
          const vv = window.lodge;
          if (vv.overlay.loadingContent) {
            vv.overlay.reveal({ innerContent: vv.overlay.loadingContent });
          }
        },

        /**
         * /// lodge.overlay.create
         * Loads the overlay template/CSS and creates necessary DOM elements to go with it.
         * Called automatically as part of the lodge _constructor setup.
         *
         * @param {function} [callback] - Fired once all elements are created and the overlay template/styles have loaded.
         *
         ************************************************************************************ */
        create(callback) {
          const vv = window.lodge;
          const self = vv.overlay;
          // const move = false;

          vv.styles.injectCSS({ css: `${vv.path}/templates/overlay.css` });

          // first we create the overlay div for the whole overlay
          self.content = document.createElement("div");
          self.content.className = "lodge__overlay";
          // bind the esc key to hiding the overlay
          document.addEventListener("keyup", function addKeyup(e) {
            if (e.key === "Escape") {
              if (self.content.parentNode === document.body) {
                self.hide();
              }
            }
          });
          /*
					self.bg.addEventListener('click', function(e) {
						if(e.target === this) {
							self.hide();
						}
					});
					*/

          // now the close button in the corner
          self.close = document.createElement("div");
          self.close.className = "lodge__close";
          self.close.addEventListener("click", function addClick() {
            if (self.content.parentNode === document.body) {
              self.hide();
            }
          });

          // finally OK/Cancel buttons — these basically work
          // first a container for the buttons
          self.buttons = document.createElement("div");
          self.buttons.className = "lodge__buttons";
          // now the actual buttons
          self.buttonTrue = document.createElement("button");
          self.buttonTrue.style.display = "none";
          self.buttonFalse = document.createElement("button");
          self.buttonFalse.style.display = "none";
          // add dataset options (data attributes) to button container
          self.buttons.dataset.queryName = "";
          self.buttons.dataset.srcEmbed = "";
          // add close events to the buttons, passing true/false
          self.buttonTrue.addEventListener("click", function addClick(e) {
            e.preventDefault();
            vv.events.fire({
              obj: vv,
              type: "modalchoice",
              data: {
                modal: 1,
                queryName: self.buttons.dataset.queryName,
                buttonText: self.buttonTrue.textContent,
              },
              target: self.buttons.dataset.srcEmbed,
              echoTarget: true,
            });
            // we've announced the modal choice, now we hide the overlay
            window.lodge.overlay.hide();
          });
          self.buttonFalse.addEventListener("click", function addClick(e) {
            e.preventDefault();
            vv.events.fire({
              obj: vv,
              type: "modalchoice",
              data: {
                modal: 0,
                queryName: self.buttons.dataset.queryName,
                buttonText: self.buttonFalse.textContent,
              },
              target: self.buttons.dataset.srcEmbed,
              echoTarget: true,
            });
            // we've announced the modal choice, now we hide the overlay
            window.lodge.overlay.hide();
          });

          self.buttons.appendChild(self.buttonTrue);
          self.buttons.appendChild(self.buttonFalse);

          if (typeof callback === "function") {
            callback();
          }
        },

        /**
         * /// lodge.overlay.hide
         * Hides the overlay and unloads content. Also does some CSS class manipulation to
         * make sure normal page scroll is restored.
         *
         * @param {object} overlay
         * @param {data} overlay.returnData
         * @param {string} overlay.returnTarget
         *
         ************************************************************************************ */
        // hide({ returnData = null, returnTarget = null }) {
        hide() {
          const vv = window.lodge;
          const self = vv.overlay;
          const db = document.body;
          if (vv.embedded) {
            vv.events.fire({ obj: vv, type: "overlayhide" }); // request that the parent hides overlay
          } else {
            vv.events.fire({ obj: vv, type: "overlayhidden" }); // announce it's been hidden

            // self.content.innerHTML = '';
            while (self.content.firstChild) {
              self.content.removeChild(self.content.firstChild);
            }
            if (self.close.parentNode === db) db.removeChild(self.close);
            db.removeChild(self.content);

            // reveal any (if) overlay triggers (for inline text+overlay embeds)
            const t = document.querySelectorAll(".lodge__overlaytrigger");
            if (t.length > 0) {
              for (let i = 0, len = t.length; i < len; i++) {
                t[i].style.visibility = "visible";
              }
            }

            // hide both buttons
            self.buttonTrue.style.display = "none";
            self.buttonFalse.style.display = "none";
            // reset button data parameters
            self.buttons.dataset.queryName = "";
            self.buttons.dataset.srcEmbed = "";

            // reenable body scrolling
            vv.styles.removeClass({
              el: document.documentElement,
              className: "lodge__noscroll",
            });
          }
        },

        /**
         * /// lodge.overlay.reveal
         * Takes content, either DOM nodes or a markup string, and inserts it into the
         * overlay before making sure the overlay is visible.
         *
         * @param {object} overlay
         * @param {string|object} overlay.innerContent - Either a DOM node tree or string representation of content to be shown in the overlay.
         * @param {string} [overlay.wrapClass="lodge__component"] - A class name for the wrapper DIV. Allows for easy styling of content shown in the overlay.
         *
         ************************************************************************************ */
        reveal({
          innerContent,
          wrapClass = "lodge__component",
          modal = false,
          buttons = false,
          embedRequest = false,
        }) {
          // add the correct content to the content div
          const vv = window.lodge;
          const self = vv.overlay;
          const db = document.body;
          const positioning = document.createElement("div");
          const wrapper = document.createElement("div");
          if (vv.embedded) {
            // ask the parent to reveal overlay with contents
            vv.events.fire({
              obj: vv,
              type: "overlayreveal",
              data: {
                innerContent,
                wrapClass,
                modal,
                buttons,
                embedRequest,
              },
            });
          } else {
            // empty the content of the overlay — only needed if it hasn't been closed,
            // but doesn't hurt anything if it's empty
            while (self.content.firstChild) {
              self.content.removeChild(self.content.firstChild);
            }
            positioning.className = "lodge__position";
            wrapper.className = wrapClass;

            // check for an embed iframe request in the overlay reveal
            if (embedRequest) {
              // set up the iframe
              const iframeParams = innerContent;
              innerContent = vv.embeds.buildIframe(iframeParams);
            }

            if (typeof innerContent === "string") {
              wrapper.innerHTML = innerContent;
            } else {
              wrapper.appendChild(innerContent);
            }
            positioning.appendChild(wrapper);
            self.content.appendChild(positioning);

            // disable body scrolling
            if (
              !vv.styles.hasClass({
                el: document.documentElement,
                className: "lodge__noscroll",
              })
            ) {
              vv.styles.addClass({
                el: document.documentElement,
                className: "lodge__noscroll",
              });
            }

            if (!modal) {
              db.appendChild(self.close);
            }
            if (buttons) {
              if (buttons.modal0) {
                self.buttonFalse.textContent = buttons.modal0;
                self.buttonFalse.style.display = "inline-block";
              }
              if (buttons.modal1) {
                self.buttonTrue.textContent = buttons.modal1;
                self.buttonTrue.style.display = "inline-block";
              }
              // if these are set it's a modal request and needs these params for a proper
              // modalchoice event to fire in the original embed.
              if (buttons.queryName)
                self.buttons.dataset.queryName = buttons.queryName;
              if (buttons.srcEmbed)
                self.buttons.dataset.srcEmbed = buttons.srcEmbed;
              wrapper.appendChild(self.buttons);
            }

            if (self.content.parentNode !== db) {
              self.content.style.opacity = 0;
              db.appendChild(self.content);
              // force style refresh/redraw on element (dumb fix, older browsers)
              // eslint-disable-next-line no-unused-expressions
              window.getComputedStyle(self.content).opacity;
            }
            // will initiate fade-in if needed
            self.content.style.opacity = 1;
            vv.events.fire({ obj: vv, type: "overlayrevealed" }); // broadcast that it's revealed
          }
        },
      }, /// END lodge.overlay

      /** *************************************************************************************
       *
       * /// lodge.styles {object}
       * Add, remove, swap, and check classes for a given DOM element or inject CSS rules into
       * the main document space.
       *
       ************************************************************************************** */
      styles: {
        /**
         * /// lodge.overlay.resolveElement
         * A mostly internal function that allows a DOM element to be found either by internal
         * storage reference or using standard DOM querySelector.
         *
         * @param {string} el - A pointer to the element — either the internal storage id, prepended with "storage:" or a string that can be passed to querySelector.
         *
         ************************************************************************************ */
        resolveElement(el) {
          if (typeof el === "string") {
            if (el.substr(0, 8) === "storage:") {
              return window.lodge.storage[el.substr(8)];
            }
            return document.querySelector(el);
          }
          return el;
        },

        /**
         * /// lodge.overlay.addClass
         * Adds a CSS class to a given element.
         *
         * @param {object} style
         * @param {string|object} style.el - A pointer to the element — either the internal storage id, prepended with "storage:", a string that can be passed to querySelector, or a pointer to the element itself.
         * @param {string} style.className - The class name to add to the element.
         * @param {boolean} [style.top=false] - If top is set to true, addClass will fire an event asking the main window to add a class to a specific element. Primarily used to interact with the overlay.
         *
         ************************************************************************************ */
        addClass({ el, className, top = false }) {
          const vv = window.lodge;
          if (top && vv.embedded) {
            vv.events.fire({
              obj: vv,
              type: "addclass",
              data: {
                el,
                className,
              },
            });
          } else {
            el = vv.styles.resolveElement(el);
            if (el && !vv.styles.hasClass({ el, className })) {
              el.className = `${el.className} ${className}`;
            }
          }
        },

        /**
         * /// lodge.overlay.hasClass
         * Tests if a given element currently has a given class assigned to it.
         *
         * @param {object} style
         * @param {string|object} style.el - A pointer to the element — either the internal storage id, prepended with "storage:", a string that can be passed to querySelector, or a pointer to the element itself.
         * @param {string} style.className - The class name to test.
         *
         * @returns {boolean} is class present
         *
         ************************************************************************************ */
        hasClass({ el, className }) {
          const vv = window.lodge;
          el = vv.styles.resolveElement(el);
          return ` ${el.className} `.indexOf(` ${className} `) > -1;
        },

        /**
         * /// lodge.overlay.injectCSS
         * Injects a new <link> or <style> tag into a page, altering styles in the global scope.
         *
         * @param {object} style
         * @param {string} style.css - Either a URL or a string of CSS rules. URL will be auto-detected and set as the rel for a <link> element, where a CSS string will be included in a style tag.
         * @param {boolean} [style.important=false] - By default, CSS will be added at the top of the <head>, allowing other CSS to take precedence. If important is true the CSS will be injected at the end of <head>, allowing it to be last in the cascade.
         * @param {boolean} [style.top=false] - If top is set to true, injectCSS will fire an event asking the main window to add the CSS at that level instead of in the embed.
         *
         ************************************************************************************ */
        injectCSS({ css, important = false, top = false }) {
          const vv = window.lodge;
          let el;
          if (top && vv.embedded) {
            vv.events.fire({
              obj: vv,
              type: "injectcss",
              data: {
                css,
                important,
              },
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

        /**
         * /// lodge.overlay.removeClass
         * Removes a CSS class from a given element.
         *
         * @param {object} style
         * @param {string|object} style.el - A pointer to the element — either the internal storage id, prepended with "storage:", a string that can be passed to querySelector, or a pointer to the element itself.
         * @param {string} style.className - The class name to remove from the element.
         * @param {boolean} [style.top=false] - If top is set to true, removeClass will fire an event asking the main window to remove a class from a specific element. Primarily used to interact with the overlay.
         *
         ************************************************************************************ */
        removeClass({ el, className, top = false }) {
          const vv = window.lodge;
          if (top && vv.embedded) {
            vv.events.fire({
              obj: vv,
              type: "removeclass",
              data: {
                el,
                className,
              },
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

        /**
         * /// lodge.overlay.swapClasses
         * Swaps one class name to another. Think ".visible" changing to ".hidden" to trigger states.
         *
         * @param {object} style
         * @param {string|object} style.el - A pointer to the element — either the internal storage id, prepended with "storage:", a string that can be passed to querySelector, or a pointer to the element itself.
         * @param {string} style.oldClass - The class name we're swapping out.
         * @param {string} style.newClass - The class name we're swapping in.
         * @param {boolean} [style.top=false] - If top is set to true, swapClasses will fire an event asking the main window to swap classes on a specific element. Primarily used to interact with the overlay.
         *
         ************************************************************************************ */
        swapClasses({ el, oldClass, newClass, top = false }) {
          const vv = window.lodge;
          if (top && vv.embedded) {
            vv.events.fire({
              obj: vv,
              type: "swapclasses",
              data: {
                el,
                oldClass,
                newClass,
              },
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
      }, /// END lodge.overlay

      /** *************************************************************************************
       *
       * /// lodge.prompt {object}
       * Send a message to the user and prompt for close or input.
       *
       ************************************************************************************** */
      prompt: {
        /**
         * /// lodge.prompt.message
         * Displays a message in the overlay
         *
         * @param {object} message
         * @param {string} message.message - The main message
         * @param {string} message.context - Context and/or additional details
         * @param {string} message.button - Text for the close button, default: "Close"
         *
         ************************************************************************************ */
        message({ message, context = false, button = "Close" }) {
          const vv = window.lodge;
          let output = `<h2>${message}</h2>`;
          let buttons = false;
          if (context) output += `<p>${context}</p>`;
          if (button) buttons = { modal0: button, modal1: false };
          // console.log(buttons);
          vv.overlay.reveal({
            innerContent: output,
            buttons,
          });
        },

        /**
         * /// lodge.prompt.modal
         * Displays a message requiring a user to choose between two buttons (OK / Cancel)
         *
         * @param {object} modal
         * @param {string} modal.message - The main message / question
         * @param {string} modal.context - Context and/or additional details
         * @param {string} modal.buttons - Text for the "OK" / "Cancel" buttons
         * @param {string} modal.queryName - Give the modal query a name, for event matching
         *
         *
         ************************************************************************************ */
        modal({
          message,
          context,
          buttons = { modal0: "Cancel", modal1: "OK" },
          queryName = "",
        }) {
          const vv = window.lodge;
          buttons.queryName = queryName;
          buttons.srcEmbed = vv.id;
          let output = `<h2>${message}</h2>`;
          if (context) output += `<p>${context}</p>`;
          vv.overlay.reveal({
            innerContent: output,
            modal: true,
            buttons,
          });
          // we could also set up an event listener for modalchoice in the case of an optional
          // callback parameter. seems smart, but likely a to-do and let's look at it as a
          // pattern we could extend elsewhere.
        },
      }, /// END lodge.prompt
    }; /// END △△ lodge {object}

    //
    //
    //
    //
    // now we check if the DOM is loaded and call lodge._constructor() if/when it is.
    if (document.readyState === "loading") {
      // Loading hasn't finished yet
      document.addEventListener("DOMContentLoaded", lodge._constructor);
    } else {
      lodge._constructor(); // `DOMContentLoaded` has already fired
    }

    // return the lodge object so it becomes properly set as window.lodge
    return lodge;
  })();
}
