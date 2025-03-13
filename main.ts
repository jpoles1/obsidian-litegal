import { Plugin, Notice, getLinkpath } from 'obsidian'
import test from 'node:test';

export default class LiteGallery extends Plugin {
	async onload () {
		this.registerMarkdownCodeBlockProcessor("litegal", async (source, el, ctx) => {
			// Define variables for tracking the active slide and preview scroll speed
			let active_slide = 0;
			let preview_scroll_speed = 0;
			
			// Split the source into lines, remove brackets and whitespace, and filter out empty lines
			const image_list = source.split('\n')
				.map((line) => line.replace(/!?\[\[/, "").replace("]]", "").trim())
				.filter((line) => line)
				.map((image) => {
					// If image is a URL (http/https) or a local file path, return it as is
					if (image.match(/^(http|https):\/\//)) {
						return image
					}
					// Get first match for the given image name
					var linkpath = getLinkpath(image)
					var image_file = this.app.metadataCache.getFirstLinkpathDest(linkpath, image)
					if (image_file == null) {
						new Notice(`LiteGallery: Image not found: ${image}`)
						return null
					}
					return this.app.vault.getResourcePath(image_file)
				})
				.filter((image_path) => image_path !== null) as string[]
			// Create the lightbox container
			const lightbox_container = document.body.createEl('div', {
				cls: 'litegal-lightbox-container hidden'
			})
			lightbox_container.onclick = () => {
				lightbox_container.addClass('hidden') // Hide the lightbox when clicking outside of the image
			}
			
			// Create the lightbox element and handle click events to prevent closing the lightbox when clicking on the image
			const lightbox = lightbox_container.createEl('div')
			lightbox.classList.add('litegal-lightbox')
			lightbox.onclick = (event) => {
				event.stopPropagation()
			}

			// Create the gallery container
			const gallery = el.createEl('div', { cls: 'litegal' })
			gallery.classList.add('litegal')

			if (image_list.length > 0) {
					
				// Create the container for the active image
				const active_image_container = gallery.createEl('div', {
					cls: 'litegal-active'
				})
				
				const active_image_container_inner = active_image_container.createEl('div', {
					cls: 'litegal-active-inner'
				})

				// Create the active image element and set its source to the first image in the list
				const active_image = active_image_container_inner.createEl('img')
				active_image.src = image_list[active_slide]

				active_image.onclick = () => {
					lightbox_container.removeClass('hidden')
					lightbox_image.src = image_list[active_slide]
				}
				active_image.onerror = function() {
					this.src='https://raw.githubusercontent.com/jpoles1/obsidian-litegal/eb0e30b2709a3081dd8d32ef4371367b95694881/404notfound.jpg'
				}
				
				// Create the left arrow element and handle click event to navigate to the previous image
				const larrow = active_image_container.createEl('div', {
					text: '<',
					cls: 'litegal-arrow litegal-arrow-left'
				})
				larrow.onclick = () => {
					active_slide = (active_slide - 1 + image_list.length) % image_list.length
					active_image.src = image_list[active_slide]
				}

				// Create the right arrow element and handle click event to navigate to the next image
				const rarrow = active_image_container.createEl('div', {
					text: '>',
					cls: 'litegal-arrow litegal-arrow-right'
				})
				rarrow.onclick = () => {
					active_slide = (active_slide + 1) % image_list.length
					active_image.src = image_list[active_slide]
				}

				// Create the container for the preview section
				const preview_outer_container = gallery.createEl('div', { cls: 'litegal-preview-outer' })

				// Create the left arrow element for preview scrolling and handle mouse events to control scroll speed
				const preview_larrow = preview_outer_container.createEl('div', {
					text: '<',
					cls: 'litegal-arrow litegal-arrow-left'
				})
				preview_larrow.onmouseenter = () => {
					preview_scroll_speed = -5
				}
				preview_larrow.onmouseleave = () => {
					preview_scroll_speed = 0
				}

				// Create the right arrow element for preview scrolling and handle mouse events to control scroll speed
				const preview_rarrow = preview_outer_container.createEl('div', {
					text: '>',
					cls: 'litegal-arrow litegal-arrow-right'
				})
				preview_rarrow.onmouseenter = () => {
					preview_scroll_speed = 5
				}
				preview_rarrow.onmouseleave = () => {
					preview_scroll_speed = 0
				}

				// Create the container for the preview images
				const preview_container = preview_outer_container.createEl('div', {
					cls: 'litegal-preview'
				})
				
				// Set up interval to continuously scroll the preview images based on the scroll speed
				setInterval(() => { 
					preview_container.scrollLeft += preview_scroll_speed
				}, 10)

				// Iterate over the image list and create preview elements for each image
				image_list.forEach(async (image_path: string, i) => {				
					// Create the preview image element and set its source to the corresponding image in the list
					const preview_elem = preview_container.createEl('img', {
						cls: 'litegal-preview-img'
					})
					preview_elem.src = image_path
					preview_elem.onerror = function() {
						this.src='https://raw.githubusercontent.com/jpoles1/obsidian-litegal/eb0e30b2709a3081dd8d32ef4371367b95694881/404notfound.jpg'
					}
					
					// Handle click event to set the active slide and update the active image
					preview_elem.onclick = () => {
						active_slide = i
						active_image.src = `${image_list[active_slide]}`
					}					
					// Append the preview element to the preview container
				})
					
				// Finish creating the lightbox element
				
				// Create the left arrow element for the lightbox and handle click event to navigate to the previous
				const lightbox_larrow = lightbox.createEl('div', { 
					text: '<', 
					cls: 'litegal-arrow litegal-arrow-left' 
				})
				lightbox_larrow.onclick = () => {
					active_slide = (active_slide - 1 + image_list.length) % image_list.length
					lightbox_image.src = image_list[active_slide]
					active_image.src = image_list[active_slide]
				}

				// Create the right arrow element for the lightbox and handle click event to navigate to the next
				const lightbox_rarrow = lightbox.createEl('div', {
					text: '>',
					cls: 'litegal-arrow litegal-arrow-right'
				})
				lightbox_rarrow.onclick = () => {
					active_slide = (active_slide + 1) % image_list.length
					lightbox_image.src = image_list[active_slide]
					active_image.src = image_list[active_slide]
				}

				// Create the image element for the lightbox
				const lightbox_image = lightbox.createEl('img', {
					cls: 'litegal-lightbox-image',
				})
				lightbox_image.onerror = function() {
					this.src='https://raw.githubusercontent.com/jpoles1/obsidian-litegal/eb0e30b2709a3081dd8d32ef4371367b95694881/404notfound.jpg'
				}						


				// Create the exit element for the lightbox and handle click event to close the lightbox
				const lightbox_exit = lightbox.createEl('div', {
					text: 'X',
					cls: 'litegal-lightbox-exit'
				})
				lightbox_exit.onclick = () => {
					lightbox_container.addClass('hidden')
				}

				// Close the lightbox when pressing the escape key
				document.addEventListener('keydown', (event) => {
					if (event.key === 'Escape') {
						lightbox_container.addClass('hidden')
					}
				})
				
			} else {
				// If no images were found, display a message in the gallery container
				gallery.createEl('p', {
					text: 'No images found, please check your image list. If your images are not found, please check your "image folders" in settings.',
					cls: 'litegal-no-images'
				})
			}
		})
	}

	onunload () {
	//this.observer.disconnect()
	}
}