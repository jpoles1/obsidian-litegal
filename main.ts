import { Component, MarkdownPostProcessor, MarkdownRenderer, Plugin } from 'obsidian'

const filenamePlaceholder = '%'
const filenameExtensionPlaceholder = '%.%'

export default class ImageCaptions extends Plugin {
  observer: MutationObserver

  async onload () {
	const root_dir = this.app.vault.adapter.basePath//getResourcePath;
	this.registerMarkdownCodeBlockProcessor("lightgal", async (source, el, ctx) => {
		let active_slide = 0;
		let preview_scroll_speed = 0;

		const image_list = source.split('\n').map((line) => line.replace("[[", "").replace("]]", "").trim()).filter((line) => line)
		const image_path = (image_name: string): string => {
			return this.app.vault.adapter.getResourcePath(image_name)
		}
		
		const gallery = document.createElement('div')
		gallery.classList.add('lightgal')

		const active_image_container = document.createElement('div')
		active_image_container.classList.add('lightgal-active')
		gallery.appendChild(active_image_container)

		const active_image = document.createElement('img')
		active_image.src = `${image_path(image_list[active_slide])}`
		active_image_container.appendChild(active_image)

		const larrow = document.createElement('div')
		larrow.classList.add('lightgal-arrow')
		larrow.classList.add('lightgal-arrow-left')
		larrow.innerHTML = '&lt;'
		larrow.onclick = () => {
			active_slide = (active_slide - 1 + image_list.length) % image_list.length
			active_image.src = `${image_path(image_list[active_slide])}`
		}
		active_image_container.appendChild(larrow)

		const rarrow = document.createElement('div')
		rarrow.classList.add('lightgal-arrow')
		rarrow.classList.add('lightgal-arrow-right')
		rarrow.innerHTML = '&gt;'
		rarrow.onclick = () => {
			active_slide = (active_slide + 1) % image_list.length
			active_image.src = `${image_path(image_list[active_slide])}`
		}
		active_image_container.appendChild(rarrow)

		const preview_outer_container = document.createElement('div')
		preview_outer_container.classList.add('lightgal-preview-outer')
		gallery.appendChild(preview_outer_container)

		const preview_larrow = document.createElement('div')
		preview_larrow.classList.add('lightgal-arrow')
		preview_larrow.classList.add('lightgal-arrow-left')
		preview_larrow.innerHTML = '&lt;'
		preview_larrow.onmouseenter = () => {
			preview_scroll_speed = -5
		}
		preview_larrow.onmouseleave = () => {
			preview_scroll_speed = 0
		}
		preview_outer_container.appendChild(preview_larrow)

		const preview_rarrow = document.createElement('div')
		preview_rarrow.classList.add('lightgal-arrow')
		preview_rarrow.classList.add('lightgal-arrow-right')
		preview_rarrow.innerHTML = '&gt;'
		preview_rarrow.onmouseenter = () => {
			preview_scroll_speed = 5
		}
		preview_rarrow.onmouseleave = () => {
			preview_scroll_speed = 0
		}
		preview_outer_container.appendChild(preview_rarrow)

		const preview_container = document.createElement('div')
		preview_container.classList.add('lightgal-preview')
		preview_outer_container.appendChild(preview_container)
		
		setInterval(() => { 
			preview_container.scrollLeft += preview_scroll_speed
		}, 10)


		image_list.forEach(async (image, i) => {
			console.log(await this.app.vault.adapter.exists(image))
			const preview_elem = document.createElement('img')
			preview_elem.src = `${image_path(image)}`
			preview_elem.classList.add('lightgal-preview-img')
			preview_elem.onclick = () => {
				active_slide = i
				active_image.src = `${image_path(image_list[active_slide])}`
			}
			preview_container.appendChild(preview_elem)
		})
		console.log(this.app.vault)
		el.appendChild(gallery)
	})
  }

  onunload () {
	//this.observer.disconnect()
  }
}