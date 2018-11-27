/* global fetch */
/**
 * BEGIN HEADER
 *
 * Contains:        GitIssues Widget for <http://tracesof.net/uebersicht/>
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     This file contains the code for the GitIssues Widget for the
 *                  macOS software Übersicht.
 *
 * END HEADER
 */

/**
 * Import the CSS function to render CSS styles.
 * @type {Function}
 */
import { css } from 'uebersicht'

/**
 * Contains the information used to retrieve GitHub information.
 * @type {Object}
 */
const info = {
  'repo': 'felixhageloh/uebersicht', // The repo name, format <owner>/<repo>
  'top': 240, // Distance to top
  'left': 45 // Distance to left
}

/**
 * Issues an API request to the GitHub v3 API and, once the data has been loaded
 * call the dispatch-function to process the data.
 * @param  {Callback} dispatch The function to be called afterwards.
 * @return {void}          This function uses a callback for returning data.
 */
export const command = (dispatch) => {
  fetch('https://api.github.com/repos/' + info.repo + '/issues')
    .then((res) => {
      res.json().then(data => {
        dispatch({ 'type': 'FETCH_SUCCEDED', 'data': data })
      })
    })
    .catch((error) => {
      dispatch({ 'type': 'FETCH_FAILED', 'error': error })
    })
}

/**
 * Time in miliseconds between each refresh. Default is 600.000 (= 10 minutes)
 * @type {number}
 */
export const refreshFrequency = 600000

/**
 * Renders the widget with updated data.
 * @param  {Object} state An object containing the necessary information.
 * @return {JSX}       A JSX object used for rendering with React.
 */
export const render = (state) => (
  (
    <div>
      <h1>GitHub Issues for {info.repo.split('/')[1]}</h1>
      {state.warning}
      <table className={table}>
        <tbody>
          {state.displayIssues.map((issue, i) => {
            if (!issue || !issue.hasOwnProperty('title')) return ''
            return (<tr key={i}>
              <td>#{issue.number} </td>
              <td className={row}>
                <span>{issue.title}</span><br />
                <span className={meta}>by {issue.user} {issue.time}</span>
              </td>
            </tr>)
          })}
        </tbody>
      </table>
      {state.more}
      {state.lastChecked}
    </div>
  ))

/**
 * Initially, display information that the data is currently being fetched.
 * Preset the rest with initial values
 * @type {Object}
 */
export const initialState = {
  warning: <p className={infoTag}>Fetching GitHub Data ...</p>,
  displayIssues: [],
  moreIssues: '',
  lastChecked: ''
}

/**
 * Processes the data retrieved from the GitHub API.
 * @param  {Object} event         The object passed to the dispatch() function.
 * @param  {Object} previousState The object from the last call to updateState
 * @return {Object}               The new object containing the processed data.
 */
export const updateState = (event, previousState) => {
  // Reset
  previousState.warning = ''
  previousState.moreIssues = ''
  if (!previousState.displayIssues) previousState.displayIssues = []
  if (event.error && event.type === 'FETCH_FAILED') {
    previousState.warning = <p className={infoTag}>{event.error}</p>
  }
  if (!event.data || event.data.length === 0) {
    previousState.warning = <p className={infoTag}>No data.</p>
    return previousState
  }
  // What we need now is to fetch the issues and display them.
  let current = new Date()
  let lastChecked = 'Last updated on ' + `${monNames[current.getMonth()]} ${current.getDate()}, ${current.getFullYear()}, ${current.getHours()}:${current.getMinutes()}`
  // Reset the issues to overwrite old ones
  previousState.displayIssues = []
  for (let issue of event.data) {
    if (issue.state === 'open') {
      let t = Date.parse(issue.updated_at)
      if (Date.now() - t < 86400000) {
        t = 'yesterday'
      } else if (Date.now() - t < 604800000) {
        t = 'last week'
      } else {
        t = new Date(t)
        t = 'on ' + `${monNames[t.getMonth()]} ${t.getDate()}, ${t.getFullYear()}`
      }
      previousState.displayIssues.push({
        'title': issue.title,
        'number': issue.number,
        'url': issue.html_url,
        'user': issue.user.login,
        'time': t
      })
    }
  }
  if (previousState.displayIssues.length > 10) {
    previousState.moreIssues = <p className={infoTag}>Last updated {lastChecked}</p>
    previousState.displayIssues = previousState.displayIssues.slice(0, 10) // Only leave 10 issues
  }
  previousState.lastChecked = <p className={infoTag}>{lastChecked}</p>
  return previousState
}

/**
 * Contains written names of all months for better display.
 * @type {Array}
 */
const monNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

/**
 * The CSS style applied to all cells of a row.
 * @type {CSS}
 */
const row = css({
  borderBottom: '1px solid #fff'
})

/**
 * The CSS style applied to the table.
 * @type {CSS}
 */
const table = css({
  borderCollapse: 'separate'
})

/**
 * The CSS style applied to the meta data (author info + last updated).
 * @type {CSS}
 */
const meta = css({
  color: 'rgb(255, 200, 200)'
})

/**
 * The CSS style applied to the informational tag at the beginning and end.
 * @type {CSS}
 */
const infoTag = css({
  backgroundColor: 'rgb(240, 240, 240)',
  color: '#333',
  padding: 10,
  borderRadius: 5,
  marginTop: 15
})

/**
 * The CSS style applied to the widget itself.
 * @type {CSS}
 */
export const className = {
  top: info.top,
  left: info.left,
  color: '#fff',
  backgroundColor: 'rgba(155, 155, 155, 0.4)',
  borderRadius: 5,
  padding: 10,
  fontSize: 11,
  fontFamily: 'Helvetica'
}
