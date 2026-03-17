import { Plugin, Notice, TFile } from 'obsidian'
import { LiteGallerySettingTab } from './settingtab'
import test from 'node:test';

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
				.map((line) => {
					line = line.trim();
					// Check for Markdown image syntax: ![alt](path)
					const markdown_match = line.match(/!\[(.*)?\]\((.+?)\)/);
					if (markdown_match) {
						return {
							caption: markdown_match[1]?.trim() || '',
							path: markdown_match[2].trim()
						};
					}
					// Check for wiki-link style: [[image]] or ![[image]]
					const wiki_path = line.replace(/!?\[\[/, "").replace("]]", "").trim();
					return {
						caption: '',
						path: wiki_path
					};
				})
				.filter((line) => line.path)
				.map((image_data) => {
					// If image is a URL (http/https) or a local file path, return it as is
					if (image_data.path.match(/^(http|https):\/\//)) {
						return {
							caption: image_data.caption,
							path: image_data.path
						};
					}
					// Check if the image exists in any of the folders specified in settings and return the path if it does, otherwise return undefined
					let image_exists = false
					let image_path = undefined
					let path_options = this.settings.image_folders.map((folder) => { 
						return `${(folder.slice(-1) == "/") ? 
							(folder == "/" ? "" : folder) : // If folder doesn't need a trailing slash, don't add it (if it's root dir should just be empty string)
							`${folder}/`}${image_data.path}` // If folder needs a trailing slash, add it
					})
					for (const test_path of path_options) {
						const file = this.app.vault.getAbstractFileByPath(test_path);
						if (file instanceof TFile) {
							image_exists = true
							image_path = this.app.vault.adapter.getResourcePath(test_path)
							break
						}
					}
					if (image_path == undefined) {
						new Notice(`LiteGallery: Image not found: ${image_data.path}`)
					}
					return image_path ? {
						caption: image_data.caption,
						path: image_path
					} : undefined;
				}
			).filter((image_data) => image_data !== undefined) as Array<{caption: string, path: string}>
			console.log(image_list)
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
				active_image.src = image_list[active_slide].path

				active_image.onclick = () => {
					lightbox_container.removeClass('hidden')
					lightbox_image.src = image_list[active_slide].path
					lightbox_caption.textContent = image_list[active_slide].caption
				}
				active_image.onerror = function() {
					this.src='https://raw.githubusercontent.com/jpoles1/obsidian-litegal/eb0e30b2709a3081dd8d32ef4371367b95694881/404notfound.jpg'
				}

				// Create the caption element for the active image
				const active_caption = active_image_container.createEl('div', {
					cls: 'litegal-caption',
					text: image_list[active_slide].caption
				})
				
				// Create the left arrow element and handle click event to navigate to the previous image
				const larrow = active_image_container.createEl('div', {
					text: '<',
					cls: 'litegal-arrow litegal-arrow-left'
				})
				larrow.onclick = () => {
					active_slide = (active_slide - 1 + image_list.length) % image_list.length
					active_image.src = image_list[active_slide].path
					active_caption.textContent = image_list[active_slide].caption
				}

				// Create the right arrow element and handle click event to navigate to the next image
				const rarrow = active_image_container.createEl('div', {
					text: '>',
					cls: 'litegal-arrow litegal-arrow-right'
				})
				rarrow.onclick = () => {
					active_slide = (active_slide + 1) % image_list.length
					active_image.src = image_list[active_slide].path
					active_caption.textContent = image_list[active_slide].caption
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
				image_list.forEach(async (image_data: {caption: string, path: string}, i) => {				
					// Create the preview image element and set its source to the corresponding image in the list
					const preview_elem = preview_container.createEl('img', {
						cls: 'litegal-preview-img'
					})
					preview_elem.src = image_data.path
					preview_elem.onerror = function() {
						this.src='https://raw.githubusercontent.com/jpoles1/obsidian-litegal/eb0e30b2709a3081dd8d32ef4371367b95694881/404notfound.jpg'
					}
					
					// Handle click event to set the active slide and update the active image
					preview_elem.onclick = () => {
						active_slide = i
						active_image.src = image_list[active_slide].path
						active_caption.textContent = image_list[active_slide].caption
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
					lightbox_image.src = image_list[active_slide].path
					lightbox_caption.textContent = image_list[active_slide].caption
					active_image.src = image_list[active_slide].path
					active_caption.textContent = image_list[active_slide].caption
				}

				// Create the right arrow element for the lightbox and handle click event to navigate to the next
				const lightbox_rarrow = lightbox.createEl('div', {
					text: '>',
					cls: 'litegal-arrow litegal-arrow-right'
				})
				lightbox_rarrow.onclick = () => {
					active_slide = (active_slide + 1) % image_list.length
					lightbox_image.src = image_list[active_slide].path
					lightbox_caption.textContent = image_list[active_slide].caption
					active_image.src = image_list[active_slide].path
					active_caption.textContent = image_list[active_slide].caption
				}

				// Create the image element for the lightbox
				const lightbox_image = lightbox.createEl('img', {
					cls: 'litegal-lightbox-image',
				})
				lightbox_image.onerror = function() {
					this.src='https://raw.githubusercontent.com/jpoles1/obsidian-litegal/eb0e30b2709a3081dd8d32ef4371367b95694881/404notfound.jpg'
				}

				// Create the caption element for the lightbox
				const lightbox_caption = lightbox.createEl('div', {
					cls: 'litegal-lightbox-caption',
					text: image_list[active_slide].caption
				})						


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
