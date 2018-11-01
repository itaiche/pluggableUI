Pluggable /Extendable UI Demo
------------------------------

## Overview

A small wacky demo of simple Client APIs and how to use Events to share data.   
 
### How it works 
1. The parent page animates elements
2. On animation end for all elements we trigger an [event](https://github.com/LivePersonInc/chronosjs)
3. The event propagates to the iFrames with a random chosen animal
4. That animal plays a sound and changes his background color to Fuchsia
 
The demo relies on [Liveperson Chronos JS](https://github.com/LivePersonInc/chronosjs) for all events.
 
### Simple APIs in this project 
1. [animationAPI](src/js/animationControl.js) - a simple way to animate stuff using CSS 
2. [audioPlayer](src/children/js/audioPlayer.js) - a simple file player
 
# Credits
For the great images:
[Clipartix](http://clipartix.com)  

For the amazing animations:
[Daniel Eden (danden)](https://github.com/daneden/animate.css)

# [Demo](https://itaiche.github.io/pluggableUI/src/index.html)
