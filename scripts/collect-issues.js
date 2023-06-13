import ghGot from 'gh-got'
import { buildRFC822Date, composeFeedItem, getFeedContent, overwriteFeedContent, getConfig } from '../utils/index.js'

const { lastCheckTimestamp, breakDelimiter, issuesInScope, commentsPaginationLimit } = getConfig()

// Collect all the comments for the issues in scope
const comments = await Promise.all(issuesInScope.map(async issue => {
  const issueComments = await ghGot(
              `repos/${issue}/comments`,
              {
                token: process.env.GITHUB_TOKEN,
                pagination: { countLimit: commentsPaginationLimit }
              }
  ).json()

  // Select only comments that are newer than the last check and add issue context
  return issueComments
    .filter(comment => new Date(comment.updated_at).getTime() > lastCheckTimestamp)
    .map(comment => ({ ...comment, issue }))
}))

const relevantComments = comments.flat().map(comment => composeFeedItem({
  title: 'TODO: REVIEW THIS COMMENT',
  description: comment.body,
  pubDate: buildRFC822Date(comment.created_at),
  link: comment.html_url,
  guid: comment.html_url
})).join('')

const feedContent = getFeedContent()
const [before, after] = feedContent.split(breakDelimiter)
const updatedFeedContent = `${before}${breakDelimiter}${relevantComments}${after}`
overwriteFeedContent(updatedFeedContent)
