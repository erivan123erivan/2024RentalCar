import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, Text, Button, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { dbFirebase } from './firebase';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';

const MapScreen = ({ navigation, route }) => {
  const [markers, setMarkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [citySearch, setCitySearch] = useState('');

  const { email } = route.params;

  const openOverlay = (marker) => {
    setSelectedMarker(marker);
  };

  const closeOverlay = () => {
    setSelectedMarker(null);
  };

  useEffect(() => {
    const fetchCarData = async () => {
      const collectionRef = dbFirebase.collection('carspeople');
      const snapshot = await collectionRef.get();
      const carData = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const location = data.location;
        carData.push({
          id: doc.id,
          latitude: location.latitude,
          longitude: location.longitude,
          carName: data.carName,
          profilePicture: data.profilePicture,
          pricePerDay: data.pricePerDay,
          name: data.name,
          state: data.state,
          country: data.country,
          carPhotos: data.carPhotos,
          carModel: data.carModel,
          includedFeatures: data.includedFeatures,
          phoneNumber: data.phoneNumber,
          state: data.state,
          swiftCode: data.swiftCode,
          kilometersUsed: data.kilometersUsed,
          myemail: data.myemail,
          licensePhoto: data.licensePhoto,
          insurance: data.insurance,
          iban: data.iban,
          country: data.country,
          city: data.city,
          assuranceNumber: data.assuranceNumber,
          assuranceName: data.assuranceName,
          address: data.address,
        });
      });

      setMarkers(carData);
    };

    fetchCarData();
  }, []);

  const filteredMarkers = markers.filter(
    (marker) =>
      marker.carName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (citySearch === '' || marker.city.toLowerCase().includes(citySearch.toLowerCase()))
  );

  const navigateToDetails = () => {
    if (selectedMarker) {
      navigation.navigate('Details', { item: selectedMarker, email });
    }
  };

  const goToHome = () => {
    navigation.navigate('Home', { email });
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 5,
            shadowColor: 'black',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 5,
            marginTop: 60,
            marginLeft: 10,
            marginBottom: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={goToHome}
        >
          <Feather name="menu" size={22} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 5,
            shadowRadius: 2,
            elevation: 5,
            marginTop: 60,
            marginRight: 10,
            marginBottom: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={goToHome}
        >
          <Feather name="plus" size={22} color="black" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search cars"
        value={searchQuery}
        onChangeText={(text) => setSearchQuery(text)}
      />

      <TextInput
        style={styles.searchBar}
        placeholder="Search by City"
        value={citySearch}
        onChangeText={(text) => setCitySearch(text)}
      />

      {selectedMarker && selectedMarker.carPhotos && (
        <View style={styles.overlay}>
          <Image
            source={{ uri: selectedMarker.carPhotos[0] }}
            style={styles.carImage}
          />
          <View style={styles.detailsContainer}>
            <Text style={styles.carName}>{selectedMarker.carName}</Text>
            <Text style={styles.carModel}>{selectedMarker.carModel}</Text>
            <Text style={styles.price}>Price : {selectedMarker.pricePerDay} €</Text>
            <Text style={styles.price}>City : {selectedMarker.city} </Text>
          </View>
          <TouchableOpacity style={styles.detailsButton} onPress={navigateToDetails}>
            <Text style={styles.buttonText}>Details</Text>
          </TouchableOpacity>
          <Button title="Close" onPress={closeOverlay} />
        </View>
      )}

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 51.5074,
          longitude: -0.1278,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
      >
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.carName}
            description={marker.carModel}
            onPress={() => openOverlay(marker)}
          >
            <Image source={require('./assets/car.png')} style={{ height: 35, width: 35 }} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    fontFamily: 'Uberfont',
  },
  map: {
    width: 'auto',
    height: '100%',
  },
  searchBar: {
    margin: 10,
    marginTop: 0,
    fontFamily: 'Uberfont',
    padding: 10,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 30,
    right: 30,
    backgroundColor: 'white',
    padding: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    zIndex: 1,
  },
  carImage: {
    width: '100%',
    height: 170,
    borderRadius: 4,
  },
  detailsContainer: {
    marginTop: 10,
    flexDirection: 'column',
  },
  carName: {
    fontFamily: 'Uberfont',
    fontSize: 18,
  },
  carModel: {
    fontFamily: 'Uberfont',
    fontSize: 16,
  },
  price: {
    fontFamily: 'Uberfont',
    fontSize: 16,
  },
  detailsButton: {
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Uberfont',
  },
});

export default MapScreen;
