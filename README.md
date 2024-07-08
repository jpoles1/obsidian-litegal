# Obsidian Lite Gallery

The Lite Gallery plugin for [Obsidian](https://obsidian.md) makes it easy to create carousel image galleries in your notes. This allows you to neatly organize mutiple images into your notes while improving readability and usability. 

## How to use

1) [Install the plugin](https://help.obsidian.md/Extending+Obsidian/Community+plugins)
2) Open up the plugin settings and configure your image directories (separated by commas). In order to make inserting images easier full image paths are not required; the plugin will search through each image directory from your settings list in order, using the first image match it finds: 
    - For example `/,images,media` will first search the root folder of your vault, then the `images` directory, and finally the `media` directory to search for each image in your gallery.
3) Create a new gallery in your note using the following "codeblock" format:
```
 ```litegal
[[image1.jpg]]
this_also_works.png
path/to/image3.jpg
 ```
```
  - Note that you can use the obsidian file search by entering `[[` in the codeblock; this will not include an absolute path to the file, but as long as the file is in the image directory.

### Demonstration:

![Lite Gallery Demo](https://raw.githubusercontent.com/jpoles1/obsidian-litegal/955cd5f6f50048b9f8593bf46aa5c477a30976d5/litegaldemo.gif)