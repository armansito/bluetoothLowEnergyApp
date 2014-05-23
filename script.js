document.addEventListener('DOMContentLoaded', function() {
  // Adapter State UI
  var updateAdapterState = function(adapterState) {
    document.getElementById('powered-state').innerHTML =
        adapterState.powered;
    document.getElementById('discovery-state').innerHTML =
        adapterState.discovering;
  };

  var checkAndHandleError = function () {
      if (chrome.runtime.lastError) {
        document.getElementById('error-div').innerHTML =
            'Error: ' + chrome.runtime.lastError.message;
        return true;
      }

      document.getElementById('error-div').innerHTML = '';
      return false;
  };

  chrome.bluetooth.onAdapterStateChanged.addListener(updateAdapterState);
  chrome.bluetooth.getAdapterState(function (adapterState) {
    if (checkAndHandleError())
      return;

    updateAdapterState(adapterState);
  });

  // Device List UI
  var updateDeviceEntry = function (deviceFieldsDiv, device) {
    deviceFieldsDiv.innerHTML = '';

    var deviceFieldDiv = document.createElement('div');
    deviceFieldDiv.setAttribute('class', 'device-entry-field');
    deviceFieldDiv.appendChild(
        document.createTextNode('Address: ' + device.address));

    deviceFieldsDiv.appendChild(deviceFieldDiv);

    if (device.name) {
      deviceFieldDiv = document.createElement('div');
      deviceFieldDiv.setAttribute('class', 'device-entry-field');
      deviceFieldDiv.appendChild(
          document.createTextNode('Name: ' + device.name));

      deviceFieldsDiv.appendChild(deviceFieldDiv);
    }

    if (device.connected !== undefined) {
      deviceFieldDiv = document.createElement('div');
      deviceFieldDiv.setAttribute('class', 'device-entry-field');
      deviceFieldDiv.appendChild(
          document.createTextNode('Connected: ' + device.connected));

      deviceFieldsDiv.appendChild(deviceFieldDiv);
    }
  };

  var appendNewDevice = function(device) {
    var deviceDiv = document.createElement('div');
    deviceDiv.setAttribute('id', 'device-entry-' + device.address);
    deviceDiv.setAttribute('class', 'device-entry');

    var deviceHeader = document.createElement('h3');
    deviceHeader.appendChild(document.createTextNode('Device'));
    deviceDiv.appendChild(deviceHeader);

    var deviceFieldsDiv = document.createElement('div');
    deviceFieldsDiv.setAttribute('id', 'device-fields-' + device.address);

    updateDeviceEntry(deviceFieldsDiv, device);

    deviceDiv.appendChild(deviceFieldsDiv);

    var servicesDiv = document.createElement('div');
    servicesDiv.setAttribute('class', 'services');
    deviceDiv.appendChild(servicesDiv);

    var servicesHeader = document.createElement('h4');
    servicesHeader.appendChild(document.createTextNode('GATT Services'));

    servicesDiv.appendChild(servicesHeader);

    var foundDevices = document.getElementById('found-devices');
    foundDevices.appendChild(deviceDiv);

    chrome.bluetoothLowEnergy.getServices(device.address, function (services) {
      services.forEach(function (service) {
        appendNewService(servicesDiv, service);
      });
    });
  };

  // GATT service list UI
  var appendNewService = function (deviceServicesDiv, service) {
    var serviceDiv = document.createElement('div');
    serviceDiv.setAttribute('id', 'service-entry-' + service.instanceId);

    var serviceHeader = document.createElement('h4');
    serviceHeader.appendChild(document.createTextNode('Service'));
    serviceDiv.appendChild(serviceHeader);

    var serviceFieldsDiv = document.createElement('div');
    serviceFieldsDiv.setAttribute('id', 'service-fields-' + service.instanceId);
    serviceDiv.appendChild(serviceFieldsDiv);

    updateServiceEntry(serviceFieldsDiv, service);

    deviceServicesDiv.appendChild(serviceDiv);
  };

  var updateServiceEntry = function (serviceFieldsDiv, service) {
    serviceFieldsDiv.innerHTML = '';

    var serviceFieldDiv = document.createElement('div');
    serviceFieldDiv.setAttribute('class', 'service-entry-field');
    serviceFieldDiv.appendChild(
        document.createTextNode('ID: ' + service.instanceId));

    serviceFieldsDiv.appendChild(serviceFieldDiv);

    serviceFieldDiv = document.createElement('div');
    serviceFieldDiv.setAttribute('class', 'service-entry-field');
    serviceFieldDiv.appendChild(
        document.createTextNode('UUID: ' + service.uuid));

    serviceFieldsDiv.appendChild(serviceFieldDiv);

    serviceFieldDiv = document.createElement('div');
    serviceFieldDiv.setAttribute('class', 'service-entry-field');
    serviceFieldDiv.appendChild(
        document.createTextNode('Primary: ' + service.isPrimary));

    serviceFieldsDiv.appendChild(serviceFieldDiv);

    var characteristicsDiv = document.createElement('div');
    characteristicsDiv.setAttribute('class', 'characteristic-entries');
    serviceFieldsDiv.appendChild(characteristicsDiv);

    chrome.bluetoothLowEnergy.getCharacteristics(service.instanceId,
                                                 function (characteristics) {
      characteristicsDiv.innerHTML = '';

      if (checkAndHandleError())
        return;

      if (characteristics.length == 0)
        return;

      var characteristicsHeaderDiv = document.createElement('h5');
      characteristicsHeaderDiv.appendChild(
          document.createTextNode('Characteristics'));
      characteristicsDiv.appendChild(characteristicsHeaderDiv);

      characteristics.forEach(function (characteristic) {
        appendNewCharacteristic(characteristicsDiv, characteristic);
      });
    });
  };

  var appendNewCharacteristic = function (characteristicsDiv, characteristic) {
    var characteristicDiv = document.createElement('div');
    characteristicDiv.setAttribute('class', 'characteristic-entry');

    var characteristicHeaderDiv = document.createElement('h6');
    characteristicHeaderDiv.appendChild(
        document.createTextNode('Characteristic'));
    characteristicDiv.appendChild(characteristicHeaderDiv);

    var characteristicFieldDiv = document.createElement('div');
    characteristicFieldDiv.setAttribute('class', 'characteristic-entry-field');
    characteristicFieldDiv.appendChild(
        document.createTextNode('UUID: ' + characteristic.uuid));

    characteristicDiv.appendChild(characteristicFieldDiv);
    characteristicsDiv.appendChild(characteristicDiv);
  };

  // Put things together.
  chrome.bluetooth.onDeviceAdded.addListener(appendNewDevice);
  chrome.bluetooth.onDeviceChanged.addListener(function (device) {
    var deviceFieldsDiv = document.getElementById('device-fields-' + device.address);
    if (deviceFieldsDiv)
      updateDeviceEntry(deviceFieldsDiv, device);
  });
  chrome.bluetooth.onDeviceRemoved.addListener(function (device) {
    var deviceDiv = document.getElementById('device-entry-' + device.address);
    if (deviceDiv)
      deviceDiv.parentNode.removeChild(deviceDiv);
  });
  chrome.bluetooth.getDevices(function (devices) {
    if (checkAndHandleError())
      return;

    devices.forEach(appendNewDevice);
  });
  chrome.bluetoothLowEnergy.onServiceAdded.addListener(function (service) {
    var deviceDiv = document.getElementById('device-entry-' + service.deviceAddress);
    if (deviceDiv) {
      var servicesDiv = deviceDiv.querySelector('.services');
      if (servicesDiv)
        appendNewService(servicesDiv, service);
    }
  });
  chrome.bluetoothLowEnergy.onServiceRemoved.addListener(function (service) {
    var serviceDiv = document.getElementById('service-entry-' + service.instanceId);
    if (serviceDiv)
      serviceDiv.parentNode.removeChild(serviceDiv);
  });
  chrome.bluetoothLowEnergy.onServiceChanged.addListener(function (service) {
    var serviceFieldsDiv = document.getElementById('service-fields-' +
                                                   service.instanceId);
    if (serviceFieldsDiv)
      updateServiceEntry(serviceFieldsDiv, service);
  });
});
