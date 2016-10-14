WorldClock
-------------------------------------

`index.html` - The structure and content of the website  
`style.css` - The style of the website (colors, font, spacing, size)  
`script.js` - The functionality of the website

This website displays the time of multiple cities around the world.

To use this web application; download this repo, unzip it, and launch the "index.html" file in a browser.

Once you're on the home page; enter the number of cities into the text box, and click submit. Then click on "Show Data" to view the city data. You can also click on "Show Markers" so the info windows don't cluster the entire screen. You can click on the markers to show/hide the info windows one at a time as well.

EDIT: On the second day of writing this application (10/4/16), I noticed an issue with concurrency. Since I've only used JavaScript for individual processes before, threading is a concept that does not work well in this language and so I've decided to try and solve this issue using "Web Workers", which allow web content to run scripts in background threads... Or just rewrite this application entirely in Java, where I'm not forced to run everything asynchronously. 
