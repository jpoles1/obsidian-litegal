import { Component, MarkdownPostProcessor, MarkdownRenderer, Plugin } from 'obsidian'

const filenamePlaceholder = '%'
const filenameExtensionPlaceholder = '%.%'

export default class ImageCaptions extends Plugin {
  observer: MutationObserver

  async onload () {
	this.registerMarkdownCodeBlockProcessor("litegal", async (source, el, ctx) => {
		// Define variables for tracking the active slide and preview scroll speed
		let active_slide = 0;
		let preview_scroll_speed = 0;
		
		// Split the source into lines, remove brackets and whitespace, and filter out empty lines
		const image_list = source.split('\n').map((line) => line.replace("[[", "").replace("]]", "").trim()).filter((line) => line)
		
		// Function to get the resource path of an image
		const image_path = (image_name: string): string => {
			return this.app.vault.adapter.getResourcePath(image_name)
		}
		
		// Create the gallery container
		const gallery = document.createElement('div')
		gallery.classList.add('litegal')

		// Create the container for the active image
		const active_image_container = document.createElement('div')
		active_image_container.classList.add('litegal-active')
		gallery.appendChild(active_image_container)

		// Create the active image element and set its source to the first image in the list
		const active_image = document.createElement('img')
		active_image.src = `${image_path(image_list[active_slide])}`
		active_image_container.appendChild(active_image)

		// Create the left arrow element and handle click event to navigate to the previous image
		const larrow = document.createElement('div')
		larrow.classList.add('litegal-arrow')
		larrow.classList.add('litegal-arrow-left')
		larrow.innerHTML = '&lt;'
		larrow.onclick = () => {
			active_slide = (active_slide - 1 + image_list.length) % image_list.length
			active_image.src = `${image_path(image_list[active_slide])}`
		}
		active_image_container.appendChild(larrow)

		// Create the right arrow element and handle click event to navigate to the next image
		const rarrow = document.createElement('div')
		rarrow.classList.add('litegal-arrow')
		rarrow.classList.add('litegal-arrow-right')
		rarrow.innerHTML = '&gt;'
		rarrow.onclick = () => {
			active_slide = (active_slide + 1) % image_list.length
			active_image.src = `${image_path(image_list[active_slide])}`
		}
		active_image_container.appendChild(rarrow)

		// Create the container for the preview section
		const preview_outer_container = document.createElement('div')
		preview_outer_container.classList.add('litegal-preview-outer')
		gallery.appendChild(preview_outer_container)

		// Create the left arrow element for preview scrolling and handle mouse events to control scroll speed
		const preview_larrow = document.createElement('div')
		preview_larrow.classList.add('litegal-arrow')
		preview_larrow.classList.add('litegal-arrow-left')
		preview_larrow.innerHTML = '&lt;'
		preview_larrow.onmouseenter = () => {
			preview_scroll_speed = -5
		}
		preview_larrow.onmouseleave = () => {
			preview_scroll_speed = 0
		}
		preview_outer_container.appendChild(preview_larrow)

		// Create the right arrow element for preview scrolling and handle mouse events to control scroll speed
		const preview_rarrow = document.createElement('div')
		preview_rarrow.classList.add('litegal-arrow')
		preview_rarrow.classList.add('litegal-arrow-right')
		preview_rarrow.innerHTML = '&gt;'
		preview_rarrow.onmouseenter = () => {
			preview_scroll_speed = 5
		}
		preview_rarrow.onmouseleave = () => {
			preview_scroll_speed = 0
		}
		preview_outer_container.appendChild(preview_rarrow)

		// Create the container for the preview images
		const preview_container = document.createElement('div')
		preview_container.classList.add('litegal-preview')
		preview_outer_container.appendChild(preview_container)
		
		// Set up interval to continuously scroll the preview images based on the scroll speed
		setInterval(() => { 
			preview_container.scrollLeft += preview_scroll_speed
		}, 10)

		// Iterate over the image list and create preview elements for each image
		image_list.forEach(async (image, i) => {
			// Check if the image exists in the vault
			console.log(await this.app.vault.adapter.exists(image))
			
			// Create the preview image element and set its source to the corresponding image in the list
			const preview_elem = document.createElement('img')
			preview_elem.src = `${image_path(image)}`
			preview_elem.classList.add('litegal-preview-img')
			
			// Handle click event to set the active slide and update the active image
			preview_elem.onclick = () => {
				active_slide = i
				active_image.src = `${image_path(image_list[active_slide])}`
			}
			
			// Append the preview element to the preview container
			preview_container.appendChild(preview_elem)
		})
		
		// Append the gallery to the provided element
		el.appendChild(gallery)
	})
  }

  onunload () {
	//this.observer.disconnect()
  }
}