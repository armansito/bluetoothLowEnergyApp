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
    if (checkAndHandleError()) {
      return;
    }

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

    var deviceFieldsDiv = document.createElement('div');
    deviceDiv.setAttribute('id', 'device-fields-' + device.address);

    updateDeviceEntry(deviceFieldsDiv, device);

    deviceDiv.appendChild(deviceFieldsDiv);

    var servicesDiv = document.createElement('div');
    servicesDiv.setAttribute('class', 'services');
    deviceDiv.appendChild(servicesDiv);

    var servicesHeader = document.createElement('h3');
    servicesHeader.appendChild(document.createTextNode('GATT Services'));

    servicesDiv.appendChild(servicesHeader);

    var foundDevices = document.getElementById('found-devices');
    foundDevices.appendChild(deviceDiv);

    chrome.bluetoothLowEnergy.getServices(device.address, function (services) {
      services.forEach(function (service) {
        var serviceDiv = document.createElement('div');
        serviceDiv.setAttribute('id', 'service-entry-' + service.instanceId);

        var serviceHeader = document.createElement('h4');
        serviceHeader.appendChild(document.createTextNode('Service'));
        serviceDiv.appendChild(serviceHeader);

        updateServiceEntry(serviceDiv, service);

        servicesDiv.appendChild(serviceDiv);
      });
    });
  };

  // GATT service list UI
  var updateServiceEntry = function (serviceDiv, service) {
    var serviceFieldDiv = document.createElement('div');
    serviceFieldDiv.setAttribute('class', 'service-entry-field');
    serviceFieldDiv.appendChild(
        document.createTextNode('ID: ' + service.instanceId));

    serviceDiv.appendChild(serviceFieldDiv);

    serviceFieldDiv = document.createElement('div');
    serviceFieldDiv.setAttribute('class', 'service-entry-field');
    serviceFieldDiv.appendChild(
        document.createTextNode('UUID: ' + service.uuid));

    serviceDiv.appendChild(serviceFieldDiv);

    serviceFieldDiv = document.createElement('div');
    serviceFieldDiv.setAttribute('class', 'service-entry-field');
    serviceFieldDiv.appendChild(
        document.createTextNode('Primary: ' + service.isPrimary));

    serviceDiv.appendChild(serviceFieldDiv);
  };

  // Put things together.
  chrome.bluetooth.onDeviceAdded.addListener(appendNewDevice);
  chrome.bluetooth.onDeviceChanged.addListener(function (device) {
    var deviceFieldsDiv = document.getElementById('device-fields-' + device.address);
    if (deviceFieldsDiv) {
      updateDeviceEntry(deviceFieldsDiv, device);
    }
  });
  chrome.bluetooth.onDeviceRemoved.addListener(function (device) {
    var deviceDiv = document.getElementById('device-entry-' + device.address);
    if (deviceDiv) {
      deviceDiv.parentNode.removeChild(deviceDiv);
    }
  });
  chrome.bluetooth.getDevices(function (devices) {
    if (checkAndHandleError()) {
      return;
    }

    devices.forEach(appendNewDevice);
  });
});