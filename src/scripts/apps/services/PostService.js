import axios from 'axios'
import qs from 'qs'

export default {

    post(entryId, entry, entryOptions) {
        // lets build out data object
        let sendObj = {
            action: 'entries/saveEntry',
            sectionId: '3',
            entryId: entryId,
            enabled: '1',
        };

        let itemsToNotInclude = ['vehiclePhotos', 'licenseAndRegistrationPhotos'];

        //loop through all field entries and build out sendObj
        for (let key in entry) {
            if (entry.hasOwnProperty(key) && entry[key] !== null && entryOptions.hasOwnProperty(key) && itemsToNotInclude.indexOf(key) === -1) {
                try {
                    switch (entryOptions[key].type) {
                        case 'Date':
                          if(typeof entry[key] === 'string') {
                              sendObj['fields[' + key + '][date]'] = entry[key]
                          } else if (typeof entry[key] === 'object' && entry[key].hasOwnProperty('date') && entry[key].hasOwnProperty('time')) {
                              sendObj['fields[' + key + '][date]'] = entry[key].date
                              sendObj['fields[' + key + '][time]'] = entry[key].time
                          } else {
                              console.error('Wrong date field value. Field: ', key, 'Value:', entry[key]);
                          }
                          break;
                        case 'Asset':
                          entry[key].forEach(item => {
                              sendObj['fields[' + key + '][]'] = item
                          })
                          break;
                        case 'SimpleMap_Map':
                          sendObj['fields[' + key + '][lat]'] = entry[key]['lat']
                          sendObj['fields[' + key + '][lng]'] = entry[key]['lng']
                          sendObj['fields[' + key + '][address]'] = entry[key]['address']
                          break
                        case 'Users':
                          sendObj['fields[' + key + '][]'] = entry[key][0]
                          break
                        default:
                          sendObj['fields[' + key + ']'] = entry[key]
                    }

                } catch (err) {
                    console.error(err)
                }
            }
        }
        return axios.post('/', qs.stringify(sendObj))
    },
    postMulti(entryId, entry, entryOptions, customUrl) {
        // lets build out data object
        let formData = new FormData()
        if (!customUrl) {
            formData.append('action', 'entries/saveEntry')
            formData.append('sectionId', '3')
            formData.append('enabled', '1')

            if(entryId) {
                formData.append('entryId', entryId)
            }
        }

        //loop through all field entries and build out sendObj
        for (let key in entry) {
            if (entry.hasOwnProperty(key) && entry[key] !== null && entryOptions.hasOwnProperty(key)) {
                try {
                    switch (entryOptions[key].type) {
                        case 'Date':
                          if(typeof entry[key] === 'string') {
                              formData.append('fields[' + key + '][date]', entry[key])
                          } else if (typeof entry[key] === 'object' && entry[key].hasOwnProperty('date') && entry[key].hasOwnProperty('time')) {
                              formData.append('fields[' + key + '][date]', entry[key].date)
                              formData.append('fields[' + key + '][time]', entry[key].time)
                          } else {
                              console.error('Wrong date field value. Field: ', key, 'Value:', entry[key]);
                          }
                          break;
                        case 'Assets':
                          entry[key].forEach((item) => {
                            if (item instanceof File || item instanceof Blob) {
                              //save new file
                              formData.append('fields[' + key + '][]', item, item.name)
                            } else {
                              //resave asset object
                              formData.append('fields[' + key + '][]', item.id)
                            }
                          });
                          break;
                        case 'SimpleMap_Map':
                          formData.append('fields[' + key + '][lat]', entry[key]['lat'])
                          formData.append('fields[' + key + '][lng]', entry[key]['lng'])
                          formData.append('fields[' + key + '][address]', entry[key]['address'])
                          break;
                        case 'Users':
                            if(entry[key].length) {
                                formData.append('fields[' + key + '][]', entry[key][0])
                            }
                          break;
                        default:
                          formData.append('fields[' + key + ']', entry[key])
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        }
        return axios.post(customUrl || '/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).catch(e => {
            console.error(e)
        })
    },
}
