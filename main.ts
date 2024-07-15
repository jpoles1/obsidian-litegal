import { Plugin, Notice, TFile } from 'obsidian'
import { LiteGallerySettingTab } from './settingtab'

interface LiteGallerySettings {
	image_folders: string[];
}

const DEFAULT_SETTINGS: Partial<LiteGallerySettings> = {
	image_folders: [],
};

export default class LiteGallery extends Plugin {
	settings: LiteGallerySettings;

	async load_settings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async save_settings() {
		await this.saveData(this.settings);
	}
	
	async onload () {
		await this.load_settings();

		this.addSettingTab(new LiteGallerySettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("litegal", async (source, el, ctx) => {
			// Define variables for tracking the active slide and preview scroll speed
			let active_slide = 0;
			let preview_scroll_speed = 0;
			
			// Split the source into lines, remove brackets and whitespace, and filter out empty lines
			const image_list = source.split('\n')
				.map((line) => line.replace("[[", "").replace("]]", "").trim())
				.filter((line) => line)
				.map((image) => {
					// Check if the image exists in any of the folders specified in settings and return the path if it does, otherwise return undefined
					let image_exists = false
					let image_path = undefined
					let path_options = this.settings.image_folders.map ((folder) => { return `${folder}/${image}` })
					for (const test_path of path_options) {
						const file = this.app.vault.getAbstractFileByPath(test_path);
						if (file instanceof TFile) {
							image_exists = true
							image_path = this.app.vault.adapter.getResourcePath(test_path)
							break
						}
					}
					if (image_path == undefined) {
						//new Notification("LiteGallery: Image not found", {body: image})
						//alert(`LiteGallery: Image not found: ${image}`)
						new Notice(`LiteGallery: Image not found: ${image}`)
					}
					return image_path
				}
			).filter((image_path) => image_path !== undefined) as string[]
		
			// Create the lightbox container
			const lightbox_container = document.createElement('div')
			lightbox_container.classList.add('litegal-lightbox-container')
			document.body.appendChild(lightbox_container)
			lightbox_container.onclick = () => {
				lightbox_container.addClass('hidden') // Hide the lightbox when clicking outside of the image
			}
			
			// Create the lightbox element and handle click events to prevent closing the lightbox when clicking on the image
			const lightbox = document.createElement('div')
			lightbox.classList.add('litegal-lightbox')
			lightbox_container.appendChild(lightbox)
			lightbox.onclick = (event) => {
				event.stopPropagation()
			}

			// Create the left arrow element for the lightbox and handle click event to navigate to the previous
			const lightbox_larrow = document.createEl('div', { 
				text: '&lt;', 
				cls: 'litegal-arrow litegal-arrow-left' 
			})
			lightbox_larrow.onclick = () => {
				active_slide = (active_slide - 1 + image_list.length) % image_list.length
				lightbox_image.src = image_list[active_slide]
				active_image.src = image_list[active_slide]
			}
			lightbox.appendChild(lightbox_larrow)

			// Create the right arrow element for the lightbox and handle click event to navigate to the next
			const lightbox_rarrow = document.createEl('div', {
				text: '&gt;',
				cls: 'litegal-arrow litegal-arrow-right'
			})
			lightbox_rarrow.onclick = () => {
				active_slide = (active_slide + 1) % image_list.length
				lightbox_image.src = image_list[active_slide]
				active_image.src = image_list[active_slide]
			}
			lightbox.appendChild(lightbox_rarrow)

			// Create the image element for the lightbox
			const lightbox_image = document.createEl('img', {
				cls: 'litegal-lightbox-image',
			})
			lightbox.appendChild(lightbox_image)

			// Create the exit element for the lightbox and handle click event to close the lightbox
			const lightbox_exit = document.createEl('div', {
				text: '&times;',
				cls: 'litegal-lightbox-exit'
			})
			lightbox_exit.onclick = () => {
				lightbox_container.addClass('hidden')
			}
			lightbox.appendChild(lightbox_exit)

			// Close the lightbox when pressing the escape key
			document.addEventListener('keydown', (event) => {
				if (event.key === 'Escape') {
					lightbox_container.addClass('hidden')
				}
			})

			// Create the gallery container
			const gallery = document.createEl('div', { cls: 'litegal' })
			gallery.classList.add('litegal')

			// Create the container for the active image
			const active_image_container = document.createEl('div', {
				cls: 'litegal-active'
			})
			gallery.appendChild(active_image_container)

			// Create the active image element and set its source to the first image in the list
			const active_image = document.createElement('img')
			active_image.src = image_list[active_slide]
			active_image_container.appendChild(active_image)

			active_image.onclick = () => {
				lightbox_container.removeClass('hidden')
				lightbox_image.src = image_list[active_slide]
			}

			// Create the left arrow element and handle click event to navigate to the previous image
			const larrow = document.createEl('div', {
				text: '&lt;',
				cls: 'litegal-arrow litegal-arrow-left'
			})
			larrow.onclick = () => {
				active_slide = (active_slide - 1 + image_list.length) % image_list.length
				active_image.src = image_list[active_slide]
			}
			active_image_container.appendChild(larrow)

			// Create the right arrow element and handle click event to navigate to the next image
			const rarrow = document.createEl('div', {
				text: '&gt;',
				cls: 'litegal-arrow litegal-arrow-right'
			})
			rarrow.onclick = () => {
				active_slide = (active_slide + 1) % image_list.length
				active_image.src = image_list[active_slide]
			}
			active_image_container.appendChild(rarrow)

			// Create the container for the preview section
			const preview_outer_container = document.createEl('div', { cls: 'litegal-preview-outer' })
			gallery.appendChild(preview_outer_container)

			// Create the left arrow element for preview scrolling and handle mouse events to control scroll speed
			const preview_larrow = document.createEl('div', {
				text: '&lt;',
				cls: 'litegal-arrow litegal-arrow-left'
			})
			preview_larrow.onmouseenter = () => {
				preview_scroll_speed = -5
			}
			preview_larrow.onmouseleave = () => {
				preview_scroll_speed = 0
			}
			preview_outer_container.appendChild(preview_larrow)

			// Create the right arrow element for preview scrolling and handle mouse events to control scroll speed
			const preview_rarrow = document.createEl('div', {
				text: '&gt;',
				cls: 'litegal-arrow litegal-arrow-right'
			})
			preview_rarrow.onmouseenter = () => {
				preview_scroll_speed = 5
			}
			preview_rarrow.onmouseleave = () => {
				preview_scroll_speed = 0
			}
			preview_outer_container.appendChild(preview_rarrow)

			// Create the container for the preview images
			const preview_container = document.createEl('div', {
				cls: 'litegal-preview'
			})
			preview_outer_container.appendChild(preview_container)
			
			// Set up interval to continuously scroll the preview images based on the scroll speed
			setInterval(() => { 
				preview_container.scrollLeft += preview_scroll_speed
			}, 10)

			// Iterate over the image list and create preview elements for each image
			image_list.forEach(async (image_path: string, i) => {				
				// Create the preview image element and set its source to the corresponding image in the list
				const preview_elem = document.createEl('img', {
					cls: 'litegal-preview-img'
				})
				preview_elem.src = image_path
				
				// Handle click event to set the active slide and update the active image
				preview_elem.onclick = () => {
					active_slide = i
					active_image.src = `${image_list[active_slide]}`
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