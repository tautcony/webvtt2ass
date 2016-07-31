```
                   __               __    __       ___                              
                  /\ \             /\ \__/\ \__  /'___`\                            
 __  __  __     __\ \ \____  __  __\ \ ,_\ \ ,_\/\_\ /\ \     __      ____    ____  
/\ \/\ \/\ \  /'__`\ \ '__`\/\ \/\ \\ \ \/\ \ \/\/_/// /__  /'__`\   /',__\  /',__\ 
\ \ \_/ \_/ \/\  __/\ \ \L\ \ \ \_/ |\ \ \_\ \ \_  // /_\ \/\ \L\.\_/\__, `\/\__, `\
 \ \___x___/'\ \____\\ \_,__/\ \___/  \ \__\\ \__\/\______/\ \__/.\_\/\____/\/\____/
  \/__//__/   \/____/ \/___/  \/__/    \/__/ \/__/\/_____/  \/__/\/_/\/___/  \/___/ 
```

Convert [WebVTT](http://dev.w3.org/html5/webvtt/) (The Web Video Text Tracks Format, aka html5 video subtitles) into ASS subtitle.

Under constraction🚧

## Setting up

```bash
npm install webvtt2ass
# or set it up globally
npm install webvtt2ass --global
```

## Command line

You may use it from the terminal if vtt-to-str was installed globally

```bash
webvtt2ass example.vtt example.ass
webvtt2ass example.vtt (It will output the result to the console).
```

## Usage

```js

var webvtt2ass = require('webvtt2ass');
webvtt2ass('input_file_path', outputStream);
```

## TODO

Font size, alignment, etc.