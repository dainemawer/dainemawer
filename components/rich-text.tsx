import { Document, Block } from '@contentful/rich-text-types'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import Image from 'next/image'

interface RichTextProps {
	content: Document
}

interface AssetNode extends Block {
	data: {
		target: {
			fields: {
				file: {
					url: string
					width: number
					height: number
					description?: string
				}
			}
		}
	}
}

const options = {
	renderNode: {
		'embedded-asset-block': (node: AssetNode) => {
			const { url, width, height, description } = node.data.target.fields.file
			return (
				<div className="my-8">
					<Image
						src={`https:${url}`}
						alt={description || ''}
						width={width}
						height={height}
						className="rounded-lg"
					/>
				</div>
			)
		},
	},
}

export default function RichText({ content }: RichTextProps) {
	return (
		<div className="prose dark:prose-invert max-w-none">
			{documentToReactComponents(content, options)}
		</div>
	)
}
