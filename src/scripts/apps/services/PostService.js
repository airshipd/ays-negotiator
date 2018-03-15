import axios from 'axios'
import qs from 'qs'
import { urlInspectionSubmitted } from '../config.js'

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
                            break;
                        default:
                            sendObj['fields[' + key + ']'] = entry[key]
                    }

                } catch (err) {
                    console.error(err)
                }
            }
        }
        console.log('formData', sendObj)
        return axios.post('/', qs.stringify(sendObj))
    },
    postMulti(entryId, entry, entryOptions) {
        // lets build out data object
        let formData = new FormData()
        formData.append('action', 'entries/saveEntry')
        formData.append('sectionId', '3')
        formData.append('entryId', entryId)
        formData.append('enabled', '1')

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
                            sendObj['fields[' + key + '][lat]'] = entry[key]['lat']
                            sendObj['fields[' + key + '][lng]'] = entry[key]['lng']
                            sendObj['fields[' + key + '][address]'] = entry[key]['address'];
                            break;
                        default:
                            formData.append('fields[' + key + ']', entry[key])
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        }
        console.log('formData', formData)

        return axios.post('/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    //Special API for firing "inspection submitted" event which causes emails to negotiator and car seller
    submitInspection(id)
    {
        return axios.post(urlInspectionSubmitted + '/' +  id);
    }
}
