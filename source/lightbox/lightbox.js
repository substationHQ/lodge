/**
 * Handle images/videos/embeds in the primary lodge.js overlay
 *
 * COMPRESSION SETTINGS
 * http://closure-compiler.appspot.com/
 * Closure compiler, SIMPLE MODE, then append a semi-colon to the front to be careful
 *
 * PUBLIC-ISH FUNCTIONS
 * window.lodge.lightbox.injectIframe(url url)
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

(function () {
  const vv = window.lodge;
  vv.lightbox = {
    injectIframe(url) {
      const self = vv.lightbox;
      const parsedUrl = self.parseVideoURL(url);
      vv.overlay.reveal({
        innerContent: `<div class="vv-aspect"><iframe src="${parsedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div>`,
        wrapClass: "vv-media",
      });
    },

    parseVideoURL(url) {
      /*
			Function parseVideoURL(string url)
			Accepts a URL, checks for validity youtube/vimeo, and returns a direct URL for
			the embeddable URL. Returns false if no known format is found.
			*/
      let parsed = false;
      if (url.toLowerCase().indexOf("youtube.com/watch?v=") !== -1) {
        parsed = url.replace("watch?v=", "embed/");
        parsed = parsed.replace("http:", "https:");
        if (parsed.indexOf("&") > -1) {
          parsed = parsed.substr(0, parsed.indexOf("&"));
        }
        parsed += "?autoplay=1&autohide=1&rel=0";
      } else if (url.toLowerCase().indexOf("vimeo.com/") !== -1) {
        parsed = url.replace("www.", "");
        parsed = parsed.replace("vimeo.com/", "player.vimeo.com/video/");
        parsed += "?title=1&byline=1&portrait=1&autoplay=1";
      }
      return parsed;
    },

    showGallery(img, caption, gallery) {
      let markup = `<div class="vv-gallery-img" style="background-image:url(${img});"></div>`;
      if (caption) {
        markup += `<div class="vv-gallery-caption">${caption}</div>`;
      }
      vv.overlay.reveal({innerContent: markup, wrapClass: "vv-gallery"});
      if (gallery) {
        const prev = document.createElement("div");
        prev.className = "vv-gallery-prev";
        const next = document.createElement("div");
        next.className = "vv-gallery-next";

        prev.addEventListener("click", function (e) {
          const prev = vv.lightbox.objLoop(gallery, img, "prev");
          const newimg = prev.i;
          const newcap = prev.c;
          vv.lightbox.showGallery(newimg, newcap, gallery);
        });
        next.addEventListener("click", function (e) {
          const next = vv.lightbox.objLoop(gallery, img, "next");
          const newimg = next.i;
          const newcap = next.c;
          vv.lightbox.showGallery(newimg, newcap, gallery);
        });

        const g = document.querySelector(".vv-gallery");
        g.appendChild(prev);
        g.appendChild(next);
      }
    },

    objLoop(obj, key, w) {
      const keys = Object.keys(obj);
      let g = keys[keys.length - 1];
      let r = obj[keys[0]];
      let m = 1;
      if (w == "prev") {
        g = keys[0];
        r = obj[keys[keys.length - 1]];
        m = -1;
      }
      if (g == key) {
        return r;
      }
      for (let i = 0; i < keys.length; i++) {
        if (keys[i] == key) {
          return obj[keys[i + m]];
        }
      }
    },
  };

  // look for links to video sites
  const as = document.querySelectorAll(
    'a[href*="youtube.com/watch?v="],a[href*="vimeo.com"]'
  );
  if (as.length > 0) {
    vv.overlay.create(function () {
      for (let i = 0; i < as.length; ++i) {
        as[i].addEventListener("click", function (e) {
          if (vv.measure.viewport().x > 400 && !e.metaKey) {
            e.preventDefault();
            // do the overlay thing
            const url = e.currentTarget.href;
            vv.lightbox.injectIframe(url);
          }
        });
      }
    });
  }

  // look for gallery links
  const ags = document.querySelectorAll("a.lodge.gallery,div.lodge.gallery");
  if (ags.length > 0) {
    vv.overlay.create(function () {
      for (var i = 0; i < ags.length; ++i) {
        if (ags[i].tagName.toLowerCase() == "a") {
          ags[i].addEventListener("click", function (e) {
            e.preventDefault();
            let caption = false;
            const img = this.href;
            if (this.hasAttribute("title")) {
              caption = this.title;
            }
            vv.lightbox.showGallery(img, caption);
          });
        } else {
          const imgs = ags[i].getElementsByTagName("img");
          var gallery = {};
          for (var i = 0; i < imgs.length; i++) {
            const img = imgs[i].src;
            let caption = false;
            if (imgs[i].hasAttribute("title")) {
              caption = imgs[i].title;
            }
            if (!caption && imgs[i].hasAttribute("alt")) {
              caption = imgs[i].alt;
            }
            gallery[imgs[i].src] = { i: img, c: caption };
          }
          for (let n = 0; n < imgs.length; n++) {
            imgs[n].addEventListener("click", function (e) {
              e.preventDefault();
              vv.lightbox.showGallery(
                gallery[this.src].i,
                gallery[this.src].c,
                gallery
              );
            });
          }
        }
      }
    });
  }
})();
