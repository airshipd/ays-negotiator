import axios from 'axios'
import qs from 'qs'

export default {

  post (entryId,entry,entryOptions) {
    // lets build out data object
    let sendObj = {
      action: 'entries/saveEntry',
      sectionId: '3',
      entryId: entryId,
      enabled: '1',
    }

    //setup array of properties to not include for saving
    let itemsToNotInclude = ['mechanic']

    //loop through all field entries and build out sendObj
    for (let key in entry) {
      if (entry.hasOwnProperty(key)
          && entry[key] !== null
          && itemsToNotInclude.find(x=>x===key) === undefined ) {
        try {
          switch(entryOptions[key].type) {
            case 'Date':
              sendObj['fields['+key+'][date]'] = entry[key]
              break;
            case 'Asset':
              entry[key].forEach(item=>{
                sendObj['fields['+key+'][]'] = item
              })
              break;
            default:
              sendObj['fields['+key+']'] = entry[key]
          }

        } catch(err) {
          console.error(err)
        }
      }
    }
    return axios.post('/',qs.stringify(sendObj))
  },
  postMulti (entryId,entry,entryOptions) {
    // lets build out data object
    let formData = new FormData()
    formData.append('action', 'entries/saveEntry')
    formData.append('sectionId', '3')
    formData.append('entryId', entryId)
    formData.append('enabled', '1')

    //setup array of properties to not include for saving
    let itemsToNotInclude = ['mechanic']

    //loop through all field entries and build out sendObj
    for (let key in entry) {
      if (entry.hasOwnProperty(key)
          && entry[key] !== null
          && itemsToNotInclude.find(x=>x===key) === undefined ) {
        try {
          switch(entryOptions[key].type) {
            case 'Date':
              formData.append('fields['+key+'][date]', entry[key])
              break;
            case 'Assets':
              entry[key].forEach((item)=>{
                formData.append('fields['+key+'][]',item)
              })
              break;
            default:
              formData.append('fields['+key+']',entry[key])
          }
        } catch(err) {
          console.error(err)
        }
      }
    }
    return axios.post('/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

}
