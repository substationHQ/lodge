/** *************************************************************************************
 *
 * /// lodge.debug {object}
 * Outputs messages and object details to the dev console.
 *
 ************************************************************************************** */
module.exports = {
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
            `%c${icon}%c ${vv.name}:%c\n   ${message} %O`,
            styles[type].logo,
            styles[type].name,
            styles[type].message,
            obj
          );
        } else {
          console.log(
            `%c${icon}%c ${vv.name}:%c\n   ${message}`,
            styles[type].logo,
            styles[type].name,
            styles[type].message
          );
        }
      } else {
        // queue: run through all of it as part of a collapsed group
        console.groupCollapsed(
          `%c${icon}%c ${vv.name}:%c\n   ${message}`,
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
}; /// END lodge.debug
