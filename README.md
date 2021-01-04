## Substation: Lodge

### Simple messaging, input, media, and checkout in a consistent overlay shared between iframes
Lodge was made for a more decentralized web where anyone can build a space of their own. Platform features that 
lets us talk, upload media, place orders, and connect can already be used via API. Lodge helps extend these 
features into any site as easily as embedding a video.

Built to bring UI consistency to critical workflows, Lodge is a lightweight, open library with no dependencies. It runs on both page and embed, securely synchronizing events and adding a shared overlay for modals, messages, and (coming soon) even a full checkout flow.

Lodge is a toolkit for building rich embeds for your project.

This document is half spec, half feature list, and half to-do list. (I really did try to work in a NaN joke here but never quite nailed it.

The project lives on [Glitch](https://lodge.glitch.me/) as well as [GitHub](https://github.com/substation-me/lodge).


## Managing iframes
*   Lodge scans for &lt;embed> tags with a “.lodge” class added to them and converts them into iframes
*   If the embedded page also contains the Lodge library, the iframe resizes intelligently, is added to a list of trusted iframes, and postMessage hooks allow for communication in a parent/child relationship
*   Features can be enabled or disabled at the parent level for more granular control and security
*   Convert YouTube / Vimeo links to overlay by adding a “lightboxvideo” keyword in the data-options parameter of the main lodge script tag
*   Explicitly disable execution of Lodge if the page isn’t the top frame with a “noembed” keyword
*   **TBD:** Explore loading a fully third-party CSS stack with a keyword option resetting the CSS baseline URL — overriding rules might not be the most performant, and our defaults load Google-hosted fonts which may be a non-starter for many people
*   **TBD:** Restrict access to custom content or checkout functionality for all embeds
*   **TBD:** Explore domain-based whitelists to allow embeds from only specific domains


## Overlay
*   Content
*   Automatically lightboxes YouTube/Vimeo links (if requested with a startup parameter)
*   Overlay can display custom markup passed in by scripts on the parent page, or as requested by the child iframe
*   Messaging
*   Messages (confirmation / success) can be passed to the overlay for display — modal option to require clicking an OK/Cancel button
*   **In-progress:** Messaging is working but not entirely consistent. Needs formatting and some UX thinking
*   **TBD:** Force a modal display with response. We can do this with some custom code and, but a true OK/Cancel option (any boolean) is currently a bit of a workaround 
*   User input
*   Lodge can be used to prompt a user to answer a question or as a basic form builder, with basic data types defined for the response (big text, string, number, checkboxes, radio, bool)
*   **In-progress:** There’s working code that was pulled for UX concerns, but should be reintroduced. Multi-step forms need rehinking, as do simple one-off questions/inputs. Can likely share some handlers with the checkout module.
*   Checkout
*   Support one-time and recurring payments in a single, easy workflow
*   Broad support for services and digital currencies. Braintree, Stripe, PayPal, and Interledger by 1.0, with any needed server components and demos under the same MIT licence
*   **In-progress:** Stripe support was for an earlier API version and needs reworking to match current level of support for Braintree
*   **In-progress:** Still some question marks around the final form of recurring Interledger wallet implementations — finalize detailed UX work for that process and build out one-time payment support in the near-term
*   **TBD:** Rework the server-side footprint abstraction — looking to first Stripe / PayPal implementations and their defined checkout phases as the defining standard and create a checkout-support NPM package for server side
*   Built for easy integration: checkout flow can match with most payment service authorization processes, via API calls or even for leave-and-return services like PayPal
*   Abstraction in the front-end and any server-side designed to allow supporting additional services by matching them with a standard footprint


## Minimal DOM/style manipulation features
*   No dependencies
*   Includes bare-bones utility functions for measuring screen area, minimal style and class manipulation, ajax calls, and a few other utilities — to keep filesize small it mostly just includes what’s needed for rendering the overlay and, but it has enough that it can be used for basic DOM manipulation in lieu of a full-size framework in a simple use case


## Customization
*   Hardened CSS for the overlay is included and injected (main page only) at the top of the document head. This allows for styles to be overridden in a traditional cascade. Some aspects, like fonts or colors, are easy to override, where things like positioning and scrollbar handling are significantly harder to override and require “!important” and other distinctions that show them to be significant
*   **In-progress:** The CSS rules need to be rewritten from the ground up. Their outcome, including scroll handling, the background texture, and sprites are excellent, but the markup/CSS can be significantly improved with a more modern/compact approach
*   **TBD:** Explore a light/dark theme for the overlay. Currently it’s a semi-transparent light-on-dark design, only offering that one mode  — this decision was made to use defaults that work over a light or dark theme, with subtle background textures introduced to reduce eye fatigue from text-on-text. Two distinct default themes might be overkill
*   Markup loads from compressed templates that can be overridden at the asset level for deeper integration
