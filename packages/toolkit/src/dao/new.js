import bareTemplateAbi from './utils/bare-template-abi'
import { getRecommendedGasLimit } from '../util'

/**
 * Create a new DAO
 *
 * @param {Object} params Parameters
 * @param {Object} params.repo Template repository
 * @param {Object} params.web3 web3
 * @param {Object} params.templateInstance Template instance
 * @param {string} params.newInstanceMethod New instance method name
 * @param {string[]} params.newInstanceArgs New instance arguments
 * @param {string} params.gasPrice Gas price
 */
export default async function ({
  repo,
  web3,
  templateInstance,
  newInstanceMethod,
  newInstanceArgs,
  deployEvent,
  gasPrice,
}) {
  let template

  if (!templateInstance) {
    // If not connected to IPFS, repo won't have an ABI
    const repoAbi = repo.abi || bareTemplateAbi
    template = new web3.eth.Contract(repoAbi, repo.contractAddress)
  } else {
    template = templateInstance
  }

  const method = newInstanceMethod || 'newInstance'

  if (!template.methods[method]) {
    throw new Error(
      `Template abi does not contain the requested function: ${method}(...). This may be due to the template's abi not being retrieved from IPFS. Is IPFS running?`
    )
  }

  const newInstanceTx = template.methods[newInstanceMethod || 'newInstance'](
    ...newInstanceArgs
  )
  const estimatedGas = await newInstanceTx.estimateGas()
  const { events } = await newInstanceTx.send({
    from: (await web3.eth.getAccounts())[0],
    gas: await getRecommendedGasLimit(web3, estimatedGas),
    gasPrice: 250e9,
    chainId: 137,
  })

  if (!events[deployEvent])
    throw new Error(`Could not find deploy event: ${deployEvent}`)

  return events[deployEvent].returnValues.dao
}
