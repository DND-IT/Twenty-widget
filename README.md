# Twenty-widget
Use a standalone Component from Twenty Framework


## start as a standalone

just run the index.html with the provided sample-data for the slideshow
or
install a tiny webserver
(https://www.npmjs.com/package/http-server)

with npm and run
```sh
http-server ./ -o
```
-> at the moment its a mobile-touch slideshow out of the box.
But you can configure within a variety of possibilities.

## take a look at the schema

at the Components-Folder.

## general Widget functionality

- specify the component ("slideshow")
- specify a id-hook for position in the DOM e.g."widgetTest"
- provide data-object according to the schema.

```sh
$<div id="widgetTest"></div>

$ var widget = Twenty.widget.create("slideshow", "widgetTest", slideshowdemodata);
```

## Widget methods

```sh
$widget.mount
$widget.umount

```
