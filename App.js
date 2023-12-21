import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { s as tw } from "react-native-wind";
import { auth, dbFirebase, firestore, firebase, storage } from "./firebase";
import { useState } from "react";
import {
  RefreshControl,
  View,
  Text,
  TextInput,
  Modal,
  FlatList,
  Image,
  Button,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableWithoutFeedback,
} from "react-native";
import MapView from "react-native-maps";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import "firebase/compat/storage";
import { StripeProvider } from "@stripe/stripe-react-native";
import PaymentTwonow from "./PaymentTwoNow";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { findNodeHandle } from "react-native";
import { shareAsync } from "expo-sharing";
import { getDocs } from "firebase/firestore";
import MapScreen from "./MapsScreen";
import { BlurView } from "expo-blur";

const Stack = createStackNavigator();



  const PaymentTotalPrice = ({ route }) => {
  const { totalPrice, selectedStartDate, selectedEndDate, orderId } =
  route.params; 

    
  
  return (
    <View className="items-center justify-center h-full">
      <Text>Pickup Date: {selectedStartDate}</Text>
      <Text>Return Date: {selectedEndDate}</Text>
      <Text>Total Price: {totalPrice} €</Text>
      <View>
        <StripeProvider publishableKey="pk_live_51NOjnPEcyZZxDJRmC47FCgdYw6ByO4ggyMuZQekzOjFBdsg6ArAsUcSTRFf0ZZzfUJ7lOspHSikJDdZAoFkxggWW00dHNg2rPQ">
          <PaymentTwonow
            totalPrice={totalPrice}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            orderId={orderId}
          />
        </StripeProvider>
      </View>
    </View>
  );
};

const Payment = ({ route }) => {
  const navigation = useNavigation();
  const { item, email, selectedEndDate, selectedStartDate, orderId } =
    route.params;
  const { pricePerDay } = item;

  const oneDay = 24 * 60 * 60 * 1000;
  const pickupDateObj = new Date(selectedStartDate);
  const returnDateObj = new Date(selectedEndDate);
  const totalDays = Math.round(
    Math.abs((returnDateObj - pickupDateObj) / oneDay)
  );
  const totalPrice = pricePerDay * totalDays;
  const handleContinue = () => {
    navigation.navigate("Payment Total Price", {
      orderId,
      selectedStartDate: pickupDateObj.toDateString(),
      selectedEndDate: returnDateObj.toDateString(),
      totalPrice,
    });
  };

  return (
    <View style={tw`justify-center w-full h-full p-5`}>
      <Text>Total Price: {totalPrice} €</Text>
      <TouchableOpacity
        onPress={handleContinue}
        style={tw`items-center w-full p-4 mt-4 bg-black rounded-md`}
      >
        <Text style={tw`text-white`} className="font-custom">
          Continue to Payment
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const MyCarsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { email } = route.params;
  const [userCars, setUserCars] = useState([]);

  useEffect(() => {
    const fetchUserCars = async () => {
      try {
        const snapshot = await firestore
          .collection("carspeople")
          .where("myemail", "==", email)
          .get();
        const userCarsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserCars(userCarsData);
      } catch (error) {
        console.error("Error fetching user cars:", error);
      }
    };

    fetchUserCars();
  }, [email]);

  const handleDeleteCar = async (carId, email) => {
    try {
      const todayDate = new Date();
      // Check if there are orders within the specified date range
      const ordersSnapshot = await firestore
        .collection("orders")
        .where("item.myemail", "==", email)
        .where("selectedEndDate", ">", todayDate)
        .get();

      if (!ordersSnapshot.empty) {
        console.log(
          "Cannot delete car. There are orders within the specified date range."
        );
        return;
      }
      // If no orders found, proceed with deleting the car
      await firestore.collection("carspeople").doc(carId).delete();
      setUserCars((prevUserCars) =>
        prevUserCars.filter((car) => car.id !== carId)
      );
    } catch (error) {
      console.error("Error deleting car:", error);
    }
  };

  const handleRequestDeletion = (carName) => {
    const subject = `Car Deletion Request: ${carName}`;
    const body = `Hello,\n\nI am requesting the deletion of my car "${carName}". Please proceed with the deletion process.\n\nBest regards,\n${email}`;

    const mailtoLink = `mailto:carrentallimitles@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoLink);
  };

  // build a constante that navigates to Home screen

  const backhome = () => {
    navigation.navigate("Home", { email }); // Navigate to the 'Faq' screen with the email parameter
  };

  return (
    <ScrollView className="h-full bg-white ">
      <View className="w-full h-auto p-4 bg-gray-50">
        <View className="flex-row items-center justify-between mt-12 ">
          <TouchableOpacity
            onPress={() => navigation.navigate("Home", { email })}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold font-customs">
              Manage my cars{" "}
            </Text>
          </View>

          <TouchableOpacity onPress={backhome}>
            <Ionicons name="car" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="h-full px-4 mt-12">
        <Text className="mb-2 text-xl font-bold font-customs">Hi {email}</Text>
        <Text className="mb-4 text-lg font-semibold font-customs">
          List of Your Cars:
        </Text>
        {userCars.map((car, index) => (
          <View key={index} className="p-4 mb-4 bg-white rounded-lg shadow-md">
            <Text className="mb-2 text-lg font-semibold text-black font-customs">
              Car Name: {car.carName}
            </Text>
            <Text className="mb-1 text-gray-800 font-customs">
              Car Model: {car.carModel}
            </Text>
            <Text className="mb-1 text-gray-800 font-customs">
              State: {car.state}
            </Text>
            <Text className="mb-1 text-gray-800 font-customs">
              Country: {car.country}
            </Text>
            <Text className="mb-1 text-gray-800 font-customs">
              Address: {car.address}
            </Text>
            <Text className="mb-2 text-gray-800 font-customs">
              Price per day: {car.pricePerDay} €
            </Text>

            {/* Assuming carPhotos is an array of photo URLs, you can display them as follows */}
            <View className="flex flex-row mb-2 space-x-2">
              {car.carPhotos.map((photoUrl, photoIndex) => (
                <Image
                  key={photoIndex}
                  source={{ uri: photoUrl }}
                  style={{ width: "100%", height: 200, borderRadius: 8 }}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => handleDeleteCar(car.id, email)}
              className="items-center px-4 py-3 mt-12 mb-4 bg-red-500 rounded-lg"
            >
              <Text className="font-semibold text-white font-customs">
                Delete your car
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRequestDeletion(car.carName)}
              className="items-center px-4 py-3 rounded-lg bg-[#32BA78]"
            >
              <Text className="font-semibold text-white font-customs">
                Request deletion
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};





















const BookingSecondScreen = ({ route }) => {
  const navigation = useNavigation();
  const { item, email, selectedEndDate, selectedStartDate } = route.params;
  const [address, setAddress] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [insuranceName, setInsuranceName] = useState("");
  const [mobilePhoneInsurance, setMobilePhoneInsurance] = useState("");
  const [idCard, setIdCard] = useState(null);
  const [driverLicense, setDriverLicense] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle ID Card image selection
  useEffect(() => {
    // Request permission to access the device's camera roll
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
  }, []);

  const handleIdCardPicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setIdCard(result.assets[0].uri); // Use assets[0] to get the selected asset
    }
  };

  const handleDriverLicensePicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setDriverLicense(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (
      !address ||
      !emailAddress ||
      !mobileNumber ||
      !fullName ||
      !insuranceName ||
      !mobilePhoneInsurance
    ) {
      alert("Please fill in all the required fields.");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);

      const idCardBlob = await fetch(idCard).then((res) => res.blob());
      const idCardRef = storage.ref().child(`id_cardsusers/${email}`);
      await idCardRef.put(idCardBlob);

      const driverLicenseBlob = await fetch(driverLicense).then((res) =>
        res.blob()
      );
      const driverLicenseRef = storage
        .ref()
        .child(`driver_licensesusers/${email}`);
      await driverLicenseRef.put(driverLicenseBlob);

      // Get the download URLs for the images
      const idCardUrl = await idCardRef.getDownloadURL();
      const driverLicenseUrl = await driverLicenseRef.getDownloadURL();
      // Add booking data to Firebase Firestore collection "orders"
      const docRef = await dbFirebase.collection("orders").add({
        email,
        item,
        selectedEndDate,
        selectedStartDate,
        idCard: idCardUrl,
        driverLicense: driverLicenseUrl,
        insurance: insuranceName,
        address,
        mobileNumber,
        fullName,
        insuranceNumber: "",
        mobilePhoneInsurance,
      });

      const orderId = docRef.id;
      navigation.navigate("Payment final", {
        email,
        orderId,
        item,
        selectedEndDate: selectedEndDate.toDateString(),
        selectedStartDate: selectedStartDate.toDateString(),
      });
    } catch (error) {
      console.error(
        "Error uploading images or adding data to Firestore:",
        error
      );
      alert("An error occurred. Please try again later.");
    }
  };
  return (
    <View style={tw`justify-center h-full p-4 bg-white`}>
      <View className="items-center text-3xl">
        <Text className="mb-4 text-3xl text-black font-customs">Step 2...</Text>
      </View>

      <TextInput
        className="border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500"
        placeholder="Your Address"
        value={address}
        onChangeText={(text) => setAddress(text)}
      />

      <TextInput
        className="border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500"
        placeholder="Email Address"
        value={emailAddress}
        onChangeText={(text) => setEmailAddress(text)}
      />

      <TextInput
        className="border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500"
        placeholder="Mobile Phone Number"
        value={mobileNumber}
        onChangeText={(text) => setMobileNumber(text)}
      />

      <TextInput
        className="border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500"
        placeholder="Full Name"
        value={fullName}
        onChangeText={(text) => setFullName(text)}
      />

      <TextInput
        className="border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500"
        placeholder="Insurance Name"
        value={insuranceName}
        onChangeText={(text) => setInsuranceName(text)}
      />

      <TextInput
        className="border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500"
        placeholder="Mobile Phone Insurance"
        value={mobilePhoneInsurance}
        onChangeText={(text) => setMobilePhoneInsurance(text)}
      />

      <TouchableOpacity
        onPress={handleIdCardPicker}
        style={tw`w-full p-2 mb-4 border border-gray-400 font-customs`}
      >
        <Text>Select ID Card Image</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDriverLicensePicker}
        style={tw`w-full p-2 mb-4 border border-gray-400 font-customs`}
      >
        <Text>Select Driver's License Image</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center w-full p-4 mt-4 bg-black rounded-full font-customs"
        onPress={handleContinue}
      >
        {isLoading ? ( // Show loading spinner when isLoading is true
          <ActivityIndicator color="white" />
        ) : (
          <Text className="font-bold text-center text-white font-customs">
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const AskkeyScreen = ({ route }) => {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [picture, setPicture] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const navigation = useNavigation();
  const { email } = route.params;

  const SkeletonScreen = () => {
    return (
      <View className="justify-center max-w-sm p-4 border border-gray-200 rounded shadow mt-28 animate-pulse md:p-6 dark:border-gray-700">
        <View className="flex items-center justify-center h-48 mb-4 bg-gray-300 rounded dark:bg-gray-700">
          <View className="mb-4"></View>
          <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></View>
          <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></View>
          <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></View>
          <View className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></View>
          <View className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5">
            <ActivityIndicator color="green" size={22} />
          </View>
          <View className="flex items-center mt-4 space-x-3">
            <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2"></View>
            <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2"></View>
            <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2"></View>
          </View>
        </View>
      </View>
    );
  };

  const handleKey = () => {
    navigation.navigate("AskkeyNowScreen", { email });
  };

  const handlePublishCar = () => {
    navigation.navigate("CarAsk", { email });
  };

  return (
    <ScrollView className="h-full bg-white">
      <View style={tw`justify-center h-full mt-12 bg-white dark:bg-gray-900`}>
        <View
          style={tw`flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0`}
        >
          <View
            style={tw`w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-70`}
          >
            <View style={tw`p-6 space-y-4 md:space-y-6 sm:p-8`}>
              <View>
                <Text className="mb-2 text-4xl text-black font-customs">
                  Get your key and publish your car
                </Text>
              </View>

              <Text className="mb-6 text-left text-black text-md font-customs">
                Monetize your idle car and provide a valuable service by renting
                it out, earning extra income in the process.
              </Text>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1516733968668-dbdce39c4651?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHJlbnQlMjBjYXJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
                }}
                style={{ width: 300, height: 200 }}
                className="my-6 rounded-lg"
              />

              <TouchableOpacity
                className="rounded-[12px]"
                style={tw`items-center px-5 py-4 mt-4 bg-gray-100 rounded-md hover:bg-gray-600`}
                onPress={handlePublishCar}
              >
                <Text
                  style={tw`text-sm font-medium `}
                  className="text-black font-customs"
                >
                  Publish a car
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#32BA78] rounded-[12px]"
                style={tw`items-center px-5 py-4 mt-4 hover:bg-blue-600`}
                onPress={handleKey}
              >
                <Text
                  style={tw`text-sm font-medium text-white`}
                  className="font-customs"
                >
                  Ask for a key
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const HomesScreen = ({ route }) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const { email } = route.params;
  const [carsPeople, setCarsPeople] = useState([]);
  const [searchInput, setSearchInput] = useState("");

  const [searchInputdeux, setSearchInputdeux] = useState("");
  const [searchInputtrois, setSearchInputtrois] = useState("");
  const [searchInputfour, setSearchInputfour] = useState("");
  const [searchInputfive, setSearchInputfive] = useState("");
  const [searchInputsix, setSearchInputsix] = useState("");
  const [searchInputseven, setSearchInputseven] = useState("");

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const [filteredCarsPeople, setFilteredCarsPeople] = useState([]);

  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add isLoading state
  const navigation = useNavigation();

  const SkeletonScreen = () => {
    return (
      <View className="justify-center max-w-sm p-4 border border-gray-200 rounded shadow mt-28 animate-pulse md:p-6 dark:border-gray-700">
        <View className="flex items-center justify-center h-48 mb-4 bg-gray-300 rounded dark:bg-gray-700">
          <View className="mb-4"></View>
          <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></View>
          <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></View>
          <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></View>
          <View className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></View>
          <View className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5">
            <ActivityIndicator color="green" size={22} />
          </View>
          <View className="flex items-center mt-4 space-x-3">
            <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2"></View>
            <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2"></View>
            <View className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32 mb-2"></View>
          </View>
        </View>
      </View>
    );
  };

  const handle = () => {
    navigation.navigate("AskkeyNowScreen", { email });
  };

  const handleMap = () => {
    navigation.navigate("Map", { email });
  };
  const navigateScren = () => {
    navigation.navigate("Settings", { email });
  };
  const navigateToDetails = (item) => {
    navigation.navigate("Details", { item, email });
  };

  useEffect(() => {
    // Retrieve data from Firestore collection
    const unsubscribe = dbFirebase
      .collection("carspeople")
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCarsPeople(data);
        setFilteredCarsPeople(data);
        setIsLoading(false); // Initialize filtered data with all items
      });
    return () => unsubscribe();
  }, []);

  const handleSearch = (query) => {
    // Filter the carsPeople list based on the search query for carName
    const filteredData = carsPeople.filter((item) =>
      item.carName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCarsPeople(filteredData);
  };

  const handleSearchdeux = (query) => {
    // Filter the carsPeople list based on the search query for location (country and city)
    const filteredData = carsPeople.filter(
      (item) =>
        item.city.toLowerCase().includes(query.toLowerCase()) ||
        item.city.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCarsPeople(filteredData);
  };

  const handleSearchtrois = (query) => {
    // Filter the carsPeople list based on the search query for location (country and city)
    const filteredData = carsPeople.filter(
      (item) =>
        item.includedFeatures.toLowerCase().includes(query.toLowerCase()) ||
        item.includedFeatures.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCarsPeople(filteredData);
  };

  const handleSearchfour = (query) => {
    // Filter the carsPeople list based on the search query for location (country and city)
    const filteredData = carsPeople.filter(
      (item) =>
        item.insurance.toLowerCase().includes(query.toLowerCase()) ||
        item.insurance.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCarsPeople(filteredData);
  };

  const handleSearchfive = (query) => {
    // Filter the carsPeople list based on the search query for location (country and city)
    const filteredData = carsPeople.filter(
      (item) =>
        item.kilometersUsed.toLowerCase().includes(query.toLowerCase()) ||
        item.kilometersUsed.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCarsPeople(filteredData);
  };

  const handleSearchsix = (query) => {
    // Filter the carsPeople list based on the search query for location (country and city)
    const filteredData = carsPeople.filter(
      (item) =>
        item.pricePerDay.toLowerCase().includes(query.toLowerCase()) ||
        item.pricePerDay.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCarsPeople(filteredData);
  };

  const handleSearchseven = (query) => {
    // Filter the carsPeople list based on the search query for location (country and city)
    const filteredData = carsPeople.filter(
      (item) =>
        item.carModel.toLowerCase().includes(query.toLowerCase()) ||
        item.carModel.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCarsPeople(filteredData);
  };

  const data = [
    {
      placeholder: "City",
      setSearchInput: searchInputdeux,
      handleSearch: handleSearchdeux,
      icon: "map",
    },
    {
      placeholder: "Model",
      setSearchInput: searchInputseven,
      handleSearch: handleSearchseven,
      icon: "search",
    },
    {
      placeholder: "Price",
      setSearchInput: searchInputsix,
      handleSearch: handleSearchsix,
      icon: "credit-card",
    },
    {
      placeholder: "Km",
      setSearchInput: searchInputfive,
      handleSearch: handleSearchfive,
      icon: "clock",
    },
    {
      placeholder: "Features",
      setSearchInput: searchInputtrois,
      handleSearch: handleSearchtrois,
      icon: "grid",
    },
    {
      placeholder: "Insurance",
      setSearchInput: searchInputfour,
      handleSearch: handleSearchfour,
      icon: "shield",
    },
  ];

  return (
    <View style={tw`h-full p-4 bg-white `}>
      {isLoading ? (
        <SkeletonScreen />
      ) : (
        <View style={tw`mt-12`}>
          <View className="h-full bg-white">
            <ScrollView
              className="h-full bg-white"
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              <View className="bg-[#F4F5FA] rounded-[8px] mt-4 flex focus:border-[#33B978] focus:border-2 focus:bg-white">
                <View
                  className={`flex flex-row py-[8px] pl-5 ${
                    isFocused ? "border-green" : "border-gray"
                  } hover:border-x-2`}
                >
                  <Feather name="disc" color={"gray"} size={22} className="" />
                  <TextInput
                    className="bg-[#F4F5FA] outline-none flex-grow ml-4 font-customs focus:bg-white"
                    placeholder="Car name"
                    onChangeText={(text) => {
                      setSearchInput(text);
                      handleSearch(text);
                    }}
                    value={searchInput}
                  />
                </View>
              </View>

              <FlatList
                data={data}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View className="bg-[#F4F5FA] rounded-[8px]  w-[140px] mr-[14px] mt-4 flex focus:border-[#33B978] focus:border-2 focus:bg-white">
                    <View
                      className={`flex flex-row py-[8px]  pl-5 ${
                        isFocused ? "border-green" : "border-gray"
                      } hover:border-x-2`}
                    >
                      <View className="py-2">
                        <Feather name={item.icon} color={"gray"} size={20} />
                      </View>
                      <TextInput
                        className="flex-grow pl-4 focus:text-black  bg-[#F4F5FA] text-black  outline-none font-customs focus:outline-none focus:bg-white"
                        placeholder={item.placeholder}
                        onChangeText={(text) => {
                          item.handleSearch(text);
                        }}
                        value={item.searchInput}
                      />
                    </View>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
              />

              <FlatList
                data={filteredCarsPeople}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => navigateToDetails(item)}>
                    <View
                      style={tw`p-4 my-4 mb-12 bg-white border rounded-lg shadow shadow-2xl border-gray-50`}
                    >
                      <View style={tw`flex-row items-center`}>
                        <Image
                          source={{ uri: item.profilePicture }}
                          style={tw`w-8 h-8 mr-4 rounded-full`}
                        />
                        <View style={tw`flex-1`}>
                          <Text
                            style={tw`text-lg font-semibold`}
                            className="font-customs"
                          >
                            {item.name}
                          </Text>
                          <Text
                            style={tw`text-sm text-gray-500`}
                            className="font-customs"
                          >
                            {item.country}, {item.city}
                          </Text>
                        </View>
                        <Image
                          source={require("./assets/note.png")}
                          style={{ width: 70, height: 20 }}
                        />
                      </View>

                      <Text
                        style={tw`p-2 mt-2 text-sm`}
                        className="font-customs"
                      >
                        {item.carName}, {item.carModel}
                      </Text>
                      <Image
                        source={{ uri: item.carPhotos[0] }}
                        style={tw`w-full mr-4 rounded-md h-52`}
                      />
                      <Text
                        style={tw`mt-2 font-bold`}
                        className="text-gray-500 font-customs"
                      >
                        Price per day: {item.pricePerDay} €
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const DetailsScreen = ({ route }) => {
  const { item, email } = route.params;
  const navigation = useNavigation();

  const navigateToBookingScreen = () => {
    navigation.navigate("Rent first", { item, email });
  };

  const navigateToBookingDeuxScreen = () => {
    navigation.navigate("Chat", { email });
  };

  return (
    <ScrollView style={tw`flex-1 px-4 bg-white`}>
      <View style={tw`h-full bg-white`}>
        <View style={tw`mt-12`}>
          <View style={tw`flex flex-row mt-4 `}>
            <Image
              source={{ uri: item.profilePicture }}
              style={tw`w-8 h-8 mb-4 mr-4 rounded-full`}
            />
            <Text style={tw`mt-2`}>{item.name}</Text>
          </View>

          <Image
            source={{ uri: item.carPhotos[0] }}
            style={tw`w-full mt-4 mb-4 rounded-md h-60`}
          />
          <Text style={tw`p-5 `} className="font-customs text-slate-600">
            Rent the {item.carName} and explore the roads with confidence. This
            sleek and stylish car comes with a range of features including{" "}
            {item.includedFeatures} . It has traveled {item.kilometersUsed}
            kilometers and is ready to be your perfect companion in {
              item.city
            }{" "}
            , {item.country} . Rest assured with comprehensive insurance
            coverage and reach out to us at {item.phoneNumber} to start your
            exciting journey now!
          </Text>

          <View className="flex-row w-full mb-12 d-flex">
            <View className="ml-12 mr-4">
              <Text>
                <Feather name="key" size={22} color="black" /> Km:
                {item.kilometersUsed}
              </Text>
            </View>
            <Text>
              <Feather name="map-pin" size={22} color="black" /> City:{" "}
              {item.city} , {item.country}
            </Text>
          </View>

          <TouchableOpacity
            onPress={navigateToBookingScreen}
            style={tw`w-full py-4 mb-4 bg-black rounded-full`}
          >
            <Text className="font-bold text-center text-white font-customs">
              Book the car
            </Text>
          </TouchableOpacity>

          <View style={tw`items-center mb-4`}>
            <Text>Or</Text>
          </View>

          <TouchableOpacity
            onPress={navigateToBookingDeuxScreen}
            style={tw`w-full py-4 mb-4 bg-gray-200 rounded-full`}
          >
            <Text className="font-bold text-center text-gray-700 font-customs">
              Send a message
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const RentScreen = ({ route }) => {
  const navigation = useNavigation();
  const { item, email } = route.params;
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setSelectedStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setSelectedEndDate(selectedDate);
    }
  };

  const navigateToBookingScreen = () => {
    navigation.navigate("Rent Second", {
      item,
      email,
      selectedStartDate,
      selectedEndDate,
    });
  };

  return (
    <View className="flex justify-center w-full h-full p-5 my-auto bg-white">
      <View className="items-center text-3xl">
        <Text className="mb-4 text-3xl text-black font-customs">
          Select your Date
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setShowStartDatePicker(true)}
        className="mb-4 rounded-full"
      >
        <Text className="p-5 text-black bg-gray-100">Select Start Date</Text>
      </TouchableOpacity>
      {showStartDatePicker && (
        <DateTimePicker
          className="p-5 bg-black"
          value={selectedStartDate || new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {/* End Date Picker */}
      <TouchableOpacity
        onPress={() => setShowEndDatePicker(true)}
        className="mb-4"
      >
        <Text className="p-5 text-black bg-gray-100 rounded-full">
          Select End Date
        </Text>
      </TouchableOpacity>
      {showEndDatePicker && (
        <DateTimePicker
          value={selectedEndDate || new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}

      <TouchableOpacity
        className="items-center py-4 bg-black rounded-full"
        onPress={navigateToBookingScreen}
      >
        <Text className="text-white font-custom">Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const FourStepaddcar = ({ route }) => {
  const { allData } = route.params;
  const { formData, additionalData } = allData;
  const [isLoading, setIsLoading] = useState(false); // State for loading spinner
  const navigation = useNavigation();

  const {
    myemail,
    pricePerDay,
    carName,
    carModel,
    assuranceName,
    assuranceNumber,
    includedFeatures,
  } = formData;

  const {
    name,
    phoneNumber,
    address,
    country,
    city,
    state,
    insurance,
    iban,
    swiftCode,
    kilometersUsed,
  } = additionalData;

  const [carPhotos, setCarPhotos] = useState([]); // Holds the car photos
  const [licensePhoto, setLicensePhoto] = useState(""); // Holds the license photo
  const [profilePicture, setProfilePicture] = useState(""); // Holds the profile picture

  const storeFormData = async (data) => {
    try {
      // Store the form data in AsyncStorage
      await AsyncStorage.setItem("formData", JSON.stringify(data));
    } catch (error) {
      console.log("Error storing form data:", error);
    }
  };

  const retrieveFormData = async () => {
    try {
      // Retrieve the form data from AsyncStorage
      const data = await AsyncStorage.getItem("formData");
      if (data !== null) {
        // If the data exists, parse it and set the state variables
        const parsedData = JSON.parse(data);
        setCarPhotos(parsedData.carPhotos);
        setLicensePhoto(parsedData.licensePhoto);
        setProfilePicture(parsedData.profilePicture);
      }
    } catch (error) {
      console.log("Error retrieving form data:", error);
    }
  };

  const storeImageURLs = async (
    carPhotoUrls,
    licensePhotoUrl,
    profilePictureUrl
  ) => {
    try {
      // Store car photo URLs in AsyncStorage
      await AsyncStorage.setItem("carPhotos", JSON.stringify(carPhotoUrls));
      // Store license photo URL in AsyncStorage
      await AsyncStorage.setItem("licensePhoto", licensePhotoUrl);
      // Store profile picture URL in AsyncStorage
      await AsyncStorage.setItem("profilePicture", profilePictureUrl);
    } catch (error) {
      console.log("Error storing image URLs:", error);
    }
  };

  const retrieveImageURLs = async () => {
    try {
      // Retrieve car photos, license photo, and profile picture URLs from AsyncStorage
      const carPhotos = await AsyncStorage.getItem("carPhotos");
      const licensePhoto = await AsyncStorage.getItem("licensePhoto");
      const profilePicture = await AsyncStorage.getItem("profilePicture");

      if (
        carPhotos !== null &&
        licensePhoto !== null &&
        profilePicture !== null
      ) {
        // If the URLs exist, parse the car photos and set the state variables
        const parsedCarPhotos = JSON.parse(carPhotos);
        setCarPhotos(parsedCarPhotos);
        setLicensePhoto(licensePhoto);
        setProfilePicture(profilePicture);
      }
    } catch (error) {
      console.log("Error retrieving image URLs:", error);
    }
  };

  useEffect(() => {
    retrieveFormData();
    retrieveImageURLs();
  }, []);

  const handleCarPhotoUpload = async () => {
    try {
      // Request permission to access the media library
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access media library was denied"
        );
        return;
      }

      // Allow the user to pick car photos using ImagePicker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Set the selected car photos in the state
        const selectedPhotos = result.assets.map((asset) => asset.uri);
        setCarPhotos(selectedPhotos);
      }
    } catch (error) {
      console.log("Error picking car photos:", error);
    }
  };

  const handleLicensePhotoUpload = async () => {
    try {
      // Request permission to access the media library
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access media library was denied"
        );
        return;
      }

      // Allow the user to pick a license photo using ImagePicker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.uri) {
        // Set the selected license photo in the state
        setLicensePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking license photo:", error);
    }
  };

  const handleProfilePictureUpload = async () => {
    try {
      // Request permission to access the media library
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access media library was denied"
        );
        return;
      }

      // Allow the user to pick a profile picture using ImagePicker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.uri) {
        // Set the selected profile picture in the state
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking profile picture:", error);
    }
  };

  const handleSubmit = async () => {
    if (carPhotos.length === 0 || !licensePhoto || !profilePicture) {
      Alert.alert("Validation Error", "Please upload all required photos.");
      return;
    }

    try {
      // Check if a person with the same name, phone number, and car name already exists
      const existingBooking = await firestore
        .collection("carspeople")
        .where("name", "==", name)
        .where("phoneNumber", "==", phoneNumber)
        .where("carName", "==", carName)
        .get();

      if (!existingBooking.empty) {
        Alert.alert(
          "Duplicate Entry",
          "A person with the same name, phone number, and car name already exists."
        );
        return;
      }

      // Upload car photos to Firebase Storage
      const carPhotoUrls = await Promise.all(
        carPhotos.map(async (photo, index) => {
          const response = await fetch(photo);
          const blob = await response.blob();
          const photoRef = storage.ref(`carPhotos/${carName}_${index}.png`);
          await photoRef.put(blob, { contentType: "image/png" });
          const downloadURL = await photoRef.getDownloadURL();
          return downloadURL;
        })
      );

      // Upload license photo to Firebase Storage
      const licensePhotoResponse = await fetch(licensePhoto);
      const licensePhotoBlob = await licensePhotoResponse.blob();
      const licensePhotoRef = storage.ref(
        `licensePhoto/${carName}_license.png`
      );
      await licensePhotoRef.put(licensePhotoBlob, { contentType: "image/png" });
      const licensePhotoUrl = await licensePhotoRef.getDownloadURL();

      // Upload profile picture to Firebase Storage
      const profilePictureResponse = await fetch(profilePicture);
      const profilePictureBlob = await profilePictureResponse.blob();
      const profilePictureRef = storage.ref(
        `profilePicture/${carName}_profile.png`
      );
      await profilePictureRef.put(profilePictureBlob, {
        contentType: "image/png",
      });
      const profilePictureUrl = await profilePictureRef.getDownloadURL();

      // Store the form data in booking data
      const bookingData = {
        myemail,
        pricePerDay,
        carName,
        carModel,
        assuranceName,
        assuranceNumber,
        includedFeatures,
        name,
        phoneNumber,
        address,
        country,
        city,
        state,
        insurance,
        iban,
        swiftCode,
        kilometersUsed,
        carPhotos: carPhotoUrls,
        licensePhoto: licensePhotoUrl,
        profilePicture: profilePictureUrl,
      };

      await firestore.collection("carspeople").add(bookingData);
      console.log("Booking added to Firestore");

      // Store the form data in AsyncStorage
      await storeFormData({
        carPhotos: carPhotoUrls,
        licensePhoto: licensePhotoUrl,
        profilePicture: profilePictureUrl,
      });

      const updatedAllData = {
        ...allData,
        additionalData: {
          ...additionalData,
          carPhotos: carPhotoUrls,
          licensePhoto: licensePhotoUrl,
          profilePicture: profilePictureUrl,
        },
      };
      setIsLoading(true);
      navigation.navigate("Home", { allData: updatedAllData });
    } catch (error) {
      console.error("Error adding booking to Firestore:", error);
    } finally {
      setIsLoading(false); // Hide loading spinner after submission or error
    }
  };

  return (
    <ScrollView style={{ backgroundColor: "white" }}>
      <View className="flex-row items-center justify-center mb-0 space-x-12 mt-52 d-flex">
        <View className="relative">
          <View className="w-12 h-12 p-4 bg-black rounded-full">
            <Feather name="check" color="white" size={17} />
          </View>
          <View className="absolute w-12 h-1 transform -translate-y-1/2 bg-black top-1/2 left-full"></View>
        </View>

        <View className="relative">
          <View className="w-12 h-12 p-4 bg-black rounded-full">
            <Feather name="check" color="white" size={17} />
          </View>
          <View className="absolute w-12 h-1 transform -translate-y-1/2 bg-black top-1/2 left-full"></View>
        </View>

        <View className="relative">
          <View className="w-12 h-12 p-4 bg-white rounded-full border-[#33B978] border-2 rounded-4">
            <Feather name="circle" color="black" size={12} />
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: "white", padding: 14 }}>
        <View>
          <Text
            style={{
              fontFamily: "font-customs",
              fontSize: 24,
              marginBottom: 16,
            }}
          >
            {" "}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCarPhotoUpload}
          style={{
            backgroundColor: "black",
            padding: 16,
            borderRadius: 30,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontFamily: "font-customs",
            }}
          >
            Select Car Photos
          </Text>
        </TouchableOpacity>

        {carPhotos.map((photo, index) => (
          <View key={index}>
            <Text>Car Photo {index + 1}</Text>
            <Image
              source={{ uri: photo }}
              style={{ width: 200, height: 200 }}
            />
          </View>
        ))}

        <TouchableOpacity
          onPress={handleLicensePhotoUpload}
          style={{
            backgroundColor: "black",
            padding: 16,
            borderRadius: 30,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontFamily: "font-customs",
            }}
          >
            Select License Photo
          </Text>
        </TouchableOpacity>

        {licensePhoto && (
          <View>
            <Text>License Photo</Text>
            <Image
              source={{ uri: licensePhoto }}
              style={{ width: 200, height: 200 }}
            />
          </View>
        )}

        <TouchableOpacity
          onPress={handleProfilePictureUpload}
          style={{ backgroundColor: "black", padding: 16, borderRadius: 30 }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontFamily: "font-customs",
            }}
          >
            Select Profile Picture
          </Text>
        </TouchableOpacity>

        {profilePicture && (
          <View>
            <Text>Profile Picture</Text>
            <Image
              source={{ uri: profilePicture }}
              style={{ width: 200, height: 200 }}
            />
          </View>
        )}

        <Text className="mt-2 mb-4 text-2xl text-black text-[14px] font-customs">
          Wait 30 second after submit , this may take a little to submit...
        </Text>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={
            isLoading ||
            carPhotos.length === 0 ||
            !licensePhoto ||
            !profilePicture
          }
          style={{
            backgroundColor:
              isLoading ||
              carPhotos.length === 0 ||
              !licensePhoto ||
              !profilePicture
                ? "gray"
                : "black",
            padding: 10,
            borderRadius: 10,
            marginVertical: 10,
          }}
        >
          {isLoading ? ( // Show loading spinner when isLoading is true
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className="font-customs"
              style={{ color: "white", textAlign: "center", fontSize: 18 }}
            >
              Submit
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const ThirdStepaddcar = ({ route }) => {
  const { allData } = route.params;
  const { formData, additionalData } = allData;
  const navigation = useNavigation();

  const [kilometersUsed, setKilometersUsed] = useState("");

  const handleSubmit = () => {
    // Check if any field is empty
    if (kilometersUsed.trim() === "") {
      // Display an error message or perform any desired action
      alert("Please fill in all the fields");
      return;
    }

    const allDataWithKilometers = {
      formData,
      additionalData: {
        ...additionalData,
        kilometersUsed,
      },
    };

    navigation.navigate("Four Step add car", {
      allData: allDataWithKilometers,
    });
  };

  return (
    <View>
      <View style={tw`justify-center h-full p-4 bg-white`}>
        <View className="flex-row items-center justify-center mb-6 space-x-12 d-flex">
          <View className="relative">
            <View className="w-12 h-12 p-4 bg-black rounded-full">
              <Feather name="check" color="white" size={17} />
            </View>
            <View className="absolute w-12 h-1 transform -translate-y-1/2 bg-black top-1/2 left-full"></View>
          </View>

          <View className="relative">
            <View className="w-12 h-12 p-4 bg-black rounded-full">
              <Feather name="check" color="white" size={17} />
            </View>
            <View className="absolute w-12 h-1 transform -translate-y-1/2 bg-black top-1/2 left-full"></View>
          </View>

          <View className="relative">
            <View className="w-12 h-12 p-4 bg-white rounded-full border-[#33B978] border-2 rounded-4">
              <Feather name="circle" color="black" size={12} />
            </View>
          </View>
        </View>

        <TextInput
          style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="Kilometers used"
          value={kilometersUsed}
          onChangeText={(text) => setKilometersUsed(text)}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          style={tw`p-4 text-white bg-black rounded-full font-customs`}
        >
          <Text style={tw`text-center text-white font-customs`}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SecondStepaddcar = ({ route }) => {
  const navigation = useNavigation();
  const { formData } = route.params;
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [insurance, setInsurance] = useState("");
  const [iban, setIban] = useState(""); // New state for IBAN
  const [swiftCode, setSwiftCode] = useState(""); //

  const handleSubmit = () => {
    if (
      name.trim() === "" ||
      phoneNumber.trim() === "" ||
      address.trim() === "" ||
      country.trim() === "" ||
      city.trim() === "" ||
      state.trim() === "" ||
      insurance.trim() === "" ||
      iban.trim() === "" ||
      swiftCode.trim() === ""
    ) {
      // Display an error message or perform any desired action
      alert("Please fill in all the fields");
      return;
    }

    const additionalData = {
      name,
      phoneNumber,
      address,
      country,
      city,
      state,
      insurance,
      iban, // Include IBAN in the additional data
      swiftCode, // Include SWIFT/BIC Code in the additional data
    };

    const allData = {
      formData,
      additionalData,
    };

    navigation.navigate("Third Step add car", { allData });
  };
  return (
    <ScrollView className="h-full bg-white ">
      <View style={tw`justify-center h-full p-4 bg-white`} className="my-16">
        <View className="flex-row items-center justify-center mb-6 space-x-12 d-flex">
          <View className="relative">
            <View className="w-12 h-12 p-4 bg-black rounded-full">
              <Feather name="check" color="white" size={17} />
            </View>
            <View className="absolute w-12 h-1 transform -translate-y-1/2 bg-black top-1/2 left-full"></View>
          </View>

          <View className="relative">
            <View className="w-12 h-12 p-4 bg-white rounded-full border-[#33B978] border-2 rounded-4">
              <Feather name="circle" color="black" size={12} />
            </View>
            <View className="absolute w-12 h-1 transform -translate-y-1/2 bg-black top-1/2 left-full"></View>
          </View>

          <View className="w-12 h-12 p-4 bg-black rounded-full">
            <Feather name="check" color="white" size={17} />
          </View>
        </View>

        <View>
          <Text className="font-custom" style={tw`mb-4 text-2xl font-customs`}>
            Please provide your information
          </Text>
        </View>
        <TextInput
          className="font-custom"
          style={tw`border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="Your public name"
          value={name}
          onChangeText={(text) => setName(text)}
        />
        <TextInput
          className="font-custom"
          style={tw`border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="Phone number"
          value={phoneNumber}
          onChangeText={(text) => setPhoneNumber(text)}
        />
        <TextInput
          className="font-custom"
          style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="Address"
          value={address}
          onChangeText={(text) => setAddress(text)}
        />
        <TextInput
          className="font-custom"
          style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="Country"
          value={country}
          onChangeText={(text) => setCountry(text)}
        />
        <TextInput
          className="font-custom"
          style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="City"
          value={city}
          onChangeText={(text) => setCity(text)}
        />
        <TextInput
          style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="State"
          value={state}
          onChangeText={(text) => setState(text)}
        />
        <TextInput
          className="font-custom"
          style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="Insurance"
          value={insurance}
          onChangeText={(text) => setInsurance(text)}
        />
        <Text className="mt-4 mb-4 text-xl font-customs">
          {" "}
          Your bank information
        </Text>
        <TextInput
          className="font-custom"
          style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="International Bank account number "
          onChangeText={(text) => setIban(text)}
          value={iban}
        />

        <TextInput
          className="font-custom"
          style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
          placeholder="SWIFT / BIC CODE "
          value={swiftCode}
          onChangeText={(text) => setSwiftCode(text)}
        />
        <View style={tw`mb-4`}></View>

        <TouchableOpacity
          onPress={handleSubmit}
          style={tw`p-4 text-white bg-black rounded-full font-customs`}
        >
          <Text
            className="font-custom"
            style={tw`text-center text-white font-customs`}
          >
            Submit
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const BeforeCarNow = ({ route }) => {
  const { email } = route.params;
  const navigation = useNavigation();

  const backhome = () => {
    navigation.navigate("Publishcar", { email }); // Navigate to the 'Faq' screen with the email parameter
  };

  return (
    <View className="items-center justify-center h-full bg-white d-flex">
      <Text className="mb-4 text-2xl font-customs">Are you ready?</Text>

      <Text className="text-black font-customs">
        Write in a paper your:{"\n\n"}- Iban and swiftCode for transfer of money
        {"\n"}- Personal assurance number{"\n"}- Assurance name{"\n"}- Phone
        number{"\n"}- Take a picture of your car{"\n"}- Take a picture of your
        driver's license
      </Text>

      <TouchableOpacity
        onPress={backhome}
        className="px-12 py-4 mx-12 mt-4 bg-black rounded-full"
      >
        <Text className="text-white font-customs">Let's go</Text>
      </TouchableOpacity>
    </View>
  );
};

const PublishCarNow = ({ route }) => {
  const navigation = useNavigation();
  const { email } = route.params;
  const [myemail, setmyemail] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [carName, setCarName] = useState("");
  const [carModel, setCarModel] = useState("");
  const [assuranceName, setAssuranceName] = useState("");
  const [assuranceNumber, setAssuranceNumber] = useState("");
  const [includedFeatures, setIncludedFeatures] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    // Check if any field is empty
    if (
      myemail.trim() === "" ||
      pricePerDay.trim() === "" ||
      carName.trim() === "" ||
      carModel.trim() === "" ||
      assuranceName.trim() === "" ||
      assuranceNumber.trim() === "" ||
      includedFeatures.trim() === ""
    ) {
      // Display an error message or perform any desired action
      alert("Please fill in all the fields");
      return;
    }
    if (myemail !== email) {
      alert("Email does not match");
      return;
    }

    const formData = {
      myemail,
      pricePerDay,
      carName,
      carModel,
      assuranceName,
      assuranceNumber,
      includedFeatures,
    };

    setIsLoading(true); // Show loading spinner while submitting

    // Simulate some asynchronous operation, like an API call
    setTimeout(() => {
      setIsLoading(false); // Hide loading spinner
      navigation.navigate("Second Step add car", { formData });
    }, 2000); // Simulate a 2-second delay
  };

  return (
    <View style={tw`justify-center w-full h-full p-5 bg-white`}>
      <View className="flex-row items-center justify-center mb-6 space-x-12 d-flex">
        <View className="relative">
          <View className="w-12 h-12 p-4 bg-white rounded-full border-[#33B978] border-2 rounded-4">
            <Feather name="circle" color="black" size={12} />
          </View>
          <View className="absolute w-12 h-1 transform -translate-y-1/2 bg-black top-1/2 left-full"></View>
        </View>

        <View className="relative">
          <View className="w-12 h-12 p-4 bg-black rounded-full">
            <Feather name="check" color="white" size={17} />
          </View>
          <View className="absolute w-12 h-1 transform -translate-y-1/2 bg-black top-1/2 left-full"></View>
        </View>

        <View className="w-12 h-12 p-4 bg-black rounded-full">
          <Feather name="check" color="white" size={17} />
        </View>
      </View>

      <Text style={tw`pb-4 `} className="font-customs">
        Hello , {email}
      </Text>
      <TextInput
        className="font-customs"
        style={tw`border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500`}
        placeholder="Insert the email beside hello, "
        value={myemail}
        onChangeText={(text) => setmyemail(text)}
      />

      <TextInput
        className=" font-customs"
        style={tw`border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500 font-customs`}
        placeholder="Price per day in €"
        value={pricePerDay}
        onChangeText={(text) => setPricePerDay(text)}
      />

      <TextInput
        className="font-customs"
        style={tw`border border-gray-400 bg-[#F5F8FA]  font-customs p-2 mb-2 rounded-md focus:outline-none focus:border-blue-500 `}
        placeholder="Car name"
        value={carName}
        onChangeText={(text) => setCarName(text)}
      />

      <TextInput
        className="font-customs"
        style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500 `}
        placeholder="Car model"
        value={carModel}
        onChangeText={(text) => setCarModel(text)}
      />

      <TextInput
        className="font-customs"
        style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500 `}
        placeholder="Assurance Name"
        value={assuranceName}
        onChangeText={(text) => setAssuranceName(text)}
      />

      <TextInput
        className="font-customs"
        style={tw`border border-gray-400 bg-[#F5F8FA]  p-2 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
        placeholder="Assurance Number"
        value={assuranceNumber}
        onChangeText={(text) => setAssuranceNumber(text)}
      />

      <TextInput
        className="font-customs"
        style={tw`border border-gray-400 bg-[#F5F8FA]  p-6 font-customs mb-2 rounded-md focus:outline-none focus:border-blue-500`}
        placeholder="Included features GPS etc"
        value={includedFeatures}
        onChangeText={(text) => setIncludedFeatures(text)}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: "black",
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 25,
          marginTop: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
        disabled={isLoading} // Disable the button while loading
      >
        {isLoading ? (
          <ActivityIndicator color="white" /> // Show loading spinner
        ) : (
          <Text style={{ color: "white" }} className="font-custom">
            Continue
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const AskkeyNowScreen = ({ route }) => {
  const [email, setEmail] = useState("");
  const [idCard, setIdCard] = useState(null);
  const [driverLicense, setDriverLicense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Request permission to access the device's camera roll
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
  }, []);

  const handleIdCardPicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setIdCard(result.assets[0].uri); // Use assets[0] to get the selected asset
    }
  };

  const handleDriverLicensePicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setDriverLicense(result.assets[0].uri); // Use assets[0] to get the selected asset
    }
  };

  const handleSubmission = async () => {
    if (!email || !idCard || !driverLicense) {
      alert("Please fill in all fields.");
      return;
    }
    setIsSubmitting(true);

    try {
      // Check if the email already exists in the collection
      const snapshot = await firestore
        .collection("keys")
        .where("email", "==", email)
        .get();
      if (!snapshot.empty) {
        alert("Email already exists. Please use a different email.");
        setIsSubmitting(false);
        return;
      }

      // Upload images to Firebase Storage
      const idCardBlob = await fetch(idCard).then((res) => res.blob());
      const idCardRef = storage.ref().child(`id_cards/${email}`);
      await idCardRef.put(idCardBlob);

      const driverLicenseBlob = await fetch(driverLicense).then((res) =>
        res.blob()
      );
      const driverLicenseRef = storage.ref().child(`driver_licenses/${email}`);
      await driverLicenseRef.put(driverLicenseBlob);

      // Get the download URLs for the images
      const idCardUrl = await idCardRef.getDownloadURL();
      const driverLicenseUrl = await driverLicenseRef.getDownloadURL();

      // Insert user data into the Firebase Firestore collection
      await firestore.collection("askkey").add({
        email,
        idCard: idCardUrl,
        driverLicense: driverLicenseUrl,
      });

      alert("Your key has been requested");
    } catch (error) {
      console.error("Error adding user data:", error);
      alert(
        "An error occurred while adding user data. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={tw`justify-center w-full h-full bg-white`}>
      <View style={tw`mx-6 mt-5 bg-white`}>
        <Text className="mb-4 text-3xl font-custom">
          You will receive in 3 days your key
        </Text>

        <Text className="text-[14px] text-gray-500 mb-4 font-custom">
          In order to guarantee the security of our platform, it is a
          requirement for all individuals seeking to publish content to register
          within the app. For additional details regarding privacy, you can
          refer to our website's terms and conditions.
        </Text>

        <Text style={tw`font-customs`}>Email</Text>
        <TextInput
          style={tw`px-3 py-2 mt-1 normal-case border border-gray-300 rounded`}
          value={email}
          onChangeText={setEmail}
        />

        <Text>ID card</Text>
        <TouchableOpacity onPress={handleIdCardPicker}>
          <View style={tw`px-3 py-2 mt-1 border border-gray-300 rounded`}>
            {idCard ? (
              <Image
                source={{ uri: idCard }}
                style={{ width: 100, height: 100 }}
              />
            ) : (
              <Text style={tw`font-custom`}>Choose ID Card</Text>
            )}
          </View>
        </TouchableOpacity>

        <Text>Driver License:</Text>
        <TouchableOpacity onPress={handleDriverLicensePicker}>
          <View style={tw`px-3 py-2 mt-1 border border-gray-300 rounded`}>
            {driverLicense ? (
              <Image
                source={{ uri: driverLicense }}
                style={{ width: 200, height: 150 }}
              />
            ) : (
              <Text style={tw`font-custom`}>Choose Driver License</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmission}
          style={tw`items-center px-4 py-4 mt-3 bg-black rounded-full`}
        >
          <Text style={tw`text-white font-customs`} className="font-customs">
            Send the documents
          </Text>
        </TouchableOpacity>
      </View>

      {isSubmitting && (
        <View
          style={tw`absolute top-0 bottom-0 left-0 right-0 items-center justify-center bg-black bg-opacity-50`}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={tw`mt-2 text-lg font-bold text-white`}>
            Submitting...
          </Text>
        </View>
      )}
    </View>
  );
};

const CarAsk = ({ route }) => {
  const { email } = route.params;
  const navigation = useNavigation();
  const [keyPasswordInput, setKeyPasswordInput] = useState("");
  const [isValidKey, setIsValidKey] = useState(true); // Set the initial state as true

  const handleVerifyKey = () => {
    dbFirebase
      .collection("keys")
      .where("keyPassword", "==", keyPasswordInput)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          setIsValidKey(false);
        } else {
          setIsValidKey(true);
          navigation.navigate("Before", { email });
        }
      })
      .catch((error) => {
        console.log("Error verifying key password:", error);
      });
  };

  return (
    <View className="items-center justify-center h-full p-5 bg-black">
      <View className="items-center">
        <Image
          source={require("./assets/icon.png")}
          className="items-center w-12 h-12 mb-12"
        />
        <Text className="mb-4 text-2xl text-center text-white align-middle font-customs">
          Insert your key
        </Text>
      </View>
      <TextInput
        style={tw`bg-black mb-4 border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
        placeholder="Enter Key"
        value={keyPasswordInput}
        onChangeText={(text) => setKeyPasswordInput(text)}
      />
      <Button title="Verify Key" className="" onPress={handleVerifyKey} />

      {!isValidKey && (
        <Text style={{ color: "red" }}>
          Invalid Key , verify uppercase letters or wrong data
        </Text>
      )}
    </View>
  );
};

const ChatScreen = ({ route }) => {
  const { email } = route.params;
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const usersSnapshot = await firestore.collection("users").get();
      const usersData = usersSnapshot.docs.map((doc) => doc.data());
      const filteredUsers = usersData.filter((user) => user.email !== email);
      setUsers(filteredUsers);
    };

    fetchUsers();
  }, [email]);

  const handleChatPress = (user) => {
    navigation.navigate("Chatroom", {
      currentUser: { email },
      chatUser: {
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        online: user.online,
      },
    });
  };

  // Filter users based on the search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 h-full p-4 bg-white">
      <Text className="pt-12 text-2xl font-customs">Messages</Text>
      <TextInput
        className="bg-[#F6F6F6] rounded-lg border-[#F6F6F6] font-customs mt-4"
        style={{ height: 40, padding: 10, marginBottom: 10 }}
        placeholder="Search users by name.."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.email}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleChatPress(item)}>
            <View className="flex-row items-center p-4 border-b border-gray-200">
              <Image
                source={{ uri: item.profileImage }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 10,
                }}
              />
              <View className="flex-col">
                <Text className="text-lg font-medium font-customs">
                  {item.name}
                </Text>
                <Text
                  className="font-customs"
                  style={{ color: item.online ? "green" : "red" }}
                >
                  {item.online ? "Online" : "Offline"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        // Limit the number of users displayed to 1
        initialNumToRender={1}
        maxToRenderPerBatch={1}
      />
    </View>
  );
};

const ChatRoomScreen = ({ route }) => {
  const { currentUser, email, chatUser } = route.params;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const navigation = useNavigation();

  const back = () => {
    navigation.navigate("Home", { email });
  };

  useEffect(() => {
    const chatId = generateChatId(currentUser.email, chatUser.email);

    const unsubscribe = firestore
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("timestamp")
      .onSnapshot((snapshot) => {
        const messagesData = snapshot.docs.map((doc) => doc.data());
        setMessages(messagesData);
      });

    return () => unsubscribe();
  }, [currentUser.email, chatUser.email]);

  const generateChatId = (user1Email, user2Email) => {
    const sortedEmails = [user1Email, user2Email].sort();
    return `${sortedEmails[0]}_${sortedEmails[1]}`;
  };

  const sendMessage = () => {
    const chatId = generateChatId(currentUser.email, chatUser.email);

    firestore.collection("chats").doc(chatId).collection("messages").add({
      sender: currentUser.email,
      receiver: chatUser.email,
      message: message,
      timestamp: new Date(),
    });
    setMessage("");
  };

  const renderItem = ({ item }) => {
    const isSender = item.sender === currentUser.email;
    return (
      <View
        className={`p-2 ${
          isSender ? "bg-[#32BA78] self-end" : "bg-gray-200 self-start"
        } rounded-md my-1 mx-1`}
      >
        <Text className={`text-${isSender ? "white" : "black"} font-customs `}>
          {item.message}
        </Text>
        <Text
          className={`text-${
            isSender ? "white" : "black"
          } text-sm font-customs self-end`}
        >
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return `${date.getHours()}:${date.getMinutes()}`;
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-start justify-start p-4 mt-12 bg-white">
        <Image
          source={{ uri: chatUser.profileImage }}
          style={{ width: 33, height: 33, borderRadius: 50 }}
        />
        <View className="flex-col d-flex">
          <Text className="pl-4 text-xl font-bold text-center">
            {chatUser.name}
          </Text>
          <Text
            className="ml-4"
            style={{ color: chatUser.online ? "green" : "red" }}
          >
            {chatUser.online ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
      />
      <View className="flex-row items-center p-4 mb-4 bg-white">
        <TextInput
          className="flex-1 p-4 mr-4 text-black bg-gray-100 rounded-full font-customs"
          value={message}
          onChangeText={(text) => setMessage(text)}
          placeholder="Type your message here"
        />
        <TouchableOpacity
          className="bg-[#32BA78]  px-4 py-2 rounded-full"
          onPress={sendMessage}
          disabled={!message.trim()}
        >
          <Ionicons name="send-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HelpCenter = ({ route }) => {
  const { email } = route.params;
  const navigation = useNavigation();
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]); // Holds the filtered FAQ data
  const [searchText, setSearchText] = useState("");
  const backhome = () => {
    navigation.navigate("Add a car", { email }); // Navigate to the 'Faq' screen with the email parameter
  };

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        // Retrieve the collection of FAQs from Firestore
        const faqsSnapshot = await firestore.collection("faq").get();
        // Map over the documents in the snapshot and add showAnswer property to each FAQ item
        const faqsData = faqsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          showAnswer: false, // Add showAnswer property to each FAQ item
        }));
        setFaqs(faqsData); // Set the state variable "faqs" to the fetched FAQ data
        setFilteredFaqs(faqsData); // Set the state variable "filteredFaqs" to the fetched FAQ data
      } catch (error) {
        console.error("Error fetching FAQs: ", error);
      }
    };

    fetchFaqs();
  }, []);

  const toggleAnswer = (index) => {
    setFaqs((prevFaqs) => {
      const updatedFaqs = [...prevFaqs];
      updatedFaqs[index].showAnswer = !updatedFaqs[index].showAnswer;
      return updatedFaqs;
    });
  };

  const renderFaqItem = ({ item, index }) => (
    <TouchableOpacity
      className="p-4 mb-4 bg-white shadow-sm rounded-8 font-customs"
      onPress={() => toggleAnswer(index)}
    >
      <Text className="mb-1 text-lg font-bold font-customs">
        {item.Question}
      </Text>
      {item.showAnswer && (
        <Text className="text-sms font-customs ">{item.answer}</Text>
      )}
    </TouchableOpacity>
  );

  const handleSearch = (text) => {
    setSearchText(text);
    const filteredData = faqs.filter((faq) =>
      faq.Question.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredFaqs(filteredData);
  };
  return (
    <View className="flex-1 bg-white ">
      <View className="w-full h-auto p-4 bg-gray-50">
        <View className="flex-row items-center justify-between mt-12 ">
          <TouchableOpacity
            onPress={() => navigation.navigate("Home", { email })}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold font-customs">Help Center</Text>
          </View>

          <TouchableOpacity onPress={backhome}>
            <Ionicons name="car" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="h-full p-4 ">
        <Text className="mt-4 mb-2 text-xl font-bold font-customs">
          Frequently Asked Questions
        </Text>
        <View className="flex-row items-center  font-customs bg-gray-50  mb-2 border border-[#F1EFE9] rounded-lg px-4 py-2">
          <TextInput
            className="flex-1 mr-2 font-customs "
            placeholder="Search the most asked question"
            value={searchText}
            onChangeText={handleSearch}
          />
          <TouchableOpacity className="px-2 py-1 rounded-full bg-gray-50">
            <Ionicons name="search-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredFaqs}
          renderItem={renderFaqItem}
          keyExtractor={(item) => item.id}
          className="flex-1"
        />
      </View>
    </View>
  );
};

const SettingsScreenDeux = ({ route }) => {
  const { email } = route.params;
  const navigation = useNavigation();
  const handleAccount = () => {
    navigation.navigate("Account", { email });
  };

  const handleHelp = () => {
    navigation.navigate("Help Center", { email });
  };

  const handleOrderscars = () => {
    navigation.navigate("Orderscars", { email });
  };

  const handleCars = () => {
    navigation.navigate("My cars", { email });
  };

  const handleTheCar = () => {
    navigation.navigate("My orders", { email });
  };

  const handleTheCars = () => {
    navigation.navigate("My cars", { email });
  };

  const clickhere = () => {
    navigation.navigate("Map", { email });
  };
  return (
    <View className="h-full bg-white ">
      <View className="w-full h-auto p-4 bg-gray-50">
        <View className="flex-row items-center justify-between mt-12 ">
          <TouchableOpacity onPress={handleTheCars}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold font-customs">Settings</Text>
          </View>

          <TouchableOpacity onPress={handleCars}>
            <Ionicons name="car" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      <View className="items-center w-full pb-4 bg-gray-50 h-42">
        <Text className="px-4 mt-4 text-3xl font-customs">My orders</Text>
        <TouchableOpacity
          className="p-4 mt-4 rounded-[12px] bg-[#32BA78] "
          onPress={clickhere}
        >
          <Text className="text-white font-customs ">Manage my orders</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="h-full bg-white">
        <View className="flex mt-4 ml-4 mr-4">
          <TouchableOpacity
            className="block max-w-sm p-6 mt-4 ml-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            onPress={handleTheCar}
          >
            <View className="flex flex-row items-center">
              <Image
                source={require("./assets/firsticon.png")}
                style={{ width: 20, height: 20 }}
              />

              <Text className="ml-4 font-customs">My orders</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="mt-4 " onPress={handleOrderscars}>
            <View className="flex flex-row items-center max-w-sm p-6 mt-4 ml-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
              <Image
                source={require("./assets/verify.png")}
                style={{ width: 20, height: 20 }}
              />
              <Text className="ml-4 font-customs">Orders for my car</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="block max-w-sm p-6 mt-4 ml-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            onPress={handleCars}
          >
            <View className="flex flex-row items-center">
              <Image
                source={require("./assets/cardicon.png")}
                style={{ width: 20, height: 20 }}
              />

              <Text className="ml-4 font-customs">Manage my cars</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="block max-w-sm p-6 mt-4 ml-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            onPress={handleHelp}
          >
            <View className="flex flex-row items-center">
              <Image
                source={require("./assets/help.png")}
                style={{ width: 20, height: 20 }}
              />

              <Text className="ml-4 font-customs">Go to Help center</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="block max-w-sm p-6 mt-4 ml-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
            onPress={handleAccount}
          >
            <View className="flex flex-row items-center">
              <Image
                source={require("./assets/settingsicon.png")}
                style={{ width: 20, height: 22 }}
              />

              <Text className="ml-4 font-customs">Change your credentials</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="items-center justify-end mt-6 mb-6 ">
        <Text className="text-gray-500 font-custom">© limitlescar.com</Text>
      </View>
    </View>
  );
};

const AccountScreen = ({ route }) => {
  const { email } = route.params;
  const navigation = useNavigation();

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const backhome = () => {
    navigation.navigate("Home", { email }); // Navigate to the 'Faq' screen with the email parameter
  };

  const updateInformation = async () => {
    try {
      const userToUpdate = auth.currentUser;

      // Update email and password in authentication
      if (newEmail) {
        await userToUpdate.updateEmail(newEmail);
      }
      if (newPassword) {
        await userToUpdate.updatePassword(newPassword);
      }

      // Update email in Firestore collection 'users'
      await dbFirebase
        .collection("users")
        .doc(userToUpdate.uid)
        .update({
          email: newEmail || userToUpdate.email,
          password: newPassword || userToUpdate.password,
        });

      console.log("Account information updated successfully.");
    } catch (error) {
      console.error("Error updating account information:", error);
    }
  };

  return (
    <View style={tw`h-full bg-white`}>
      <View className="w-full h-auto p-4 bg-gray-50">
        <View className="flex-row items-center justify-between mt-12 ">
          <TouchableOpacity
            onPress={() => navigation.navigate("Home", { email })}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold font-customs">Account </Text>
          </View>

          <TouchableOpacity onPress={backhome}>
            <Ionicons name="car" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={tw`flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0`}
      >
        <View
          style={tw`w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-70`}
        >
          <View style={tw`p-6 space-y-4 md:space-y-6 sm:p-8`}>
            <View style={tw`space-y-4 md:space-y-6`}>
              <Text
                style={tw`block mb-2 text-sm font-medium text-gray-900 dark:text-whit`}
                className="font-customs"
              >
                New email
              </Text>
              <TextInput
                onChangeText={setNewEmail}
                value={newEmail}
                style={tw`block p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
              ></TextInput>
            </View>

            <View>
              <Text
                style={tw`block mb-2 text-sm font-medium text-gray-900 dark:text-whit`}
                className="font-customs"
              >
                New Password
              </Text>
              <TextInput
                onChangeText={setNewPassword}
                value={newPassword}
                style={tw`block p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
              ></TextInput>
            </View>

            <TouchableOpacity
              style={tw`w-full mt-4 items-center text-white bg-black hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center `}
              onPress={updateInformation}
            >
              <Text style={tw`text-white`} className="font-customs">
                Update my information
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const HomeScreen = ({ route }) => {
  const email = route.params?.email;
  const Tab = createBottomTabNavigator();

  return (
    <Tab.Navigator
      tabBarOptions={{
        activeTintColor: "black",
        showLabel: true,
        labelStyle: { fontWeight: "bold", fontFamily: "Uberfont" },
      }}
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          opacity: 1,
        },
        tabBarIcon: ({ color, focused }) => {
          let icon;
          if (route.name === "Search") {
            icon = require("./assets/searchnix.png");
          } else if (route.name === "Add a car") {
            icon = require("./assets/agoraiconblack.png");
          } else if (route.name === "Chat") {
            icon = require("./assets/chatsd.png");
          } else if (route.name === "Settings") {
            icon = require("./assets/settingf.png");
          } else if (route.name === "Welcome") {
            icon = require("./assets/Homedeuxra.png");
          } else if (route.name === "Map") {
            icon = require("./assets/settingf.png");
          }

          const iconColor = focused ? "black" : "gray";

          return (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={icon}
                style={{ width: 18, height: 18, tintColor: iconColor }}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        options={{ headerShown: false }}
        name="Welcome"
        initialParams={{ email }}
        component={Subscribe}
      />

      <Tab.Screen
        options={{ headerShown: false }}
        name="Search"
        initialParams={{ email }}
        component={HomesScreen}
      />

      <Tab.Screen
        options={{ headerShown: false }}
        name="Add a car"
        initialParams={{ email }}
        component={AskkeyScreen}
      />

      <Tab.Screen
        options={{ headerShown: false }}
        name="Chat"
        initialParams={{ email }}
        component={ChatScreen}
      />

      <Tab.Screen
        options={{ headerShown: false }}
        name="Settings"
        initialParams={{ email }}
        component={SettingsScreenDeux}
      />
    </Tab.Navigator>
  );
};

const Subscribe = ({ route }) => {
  const navigation = useNavigation();

  const { email } = route.params;

  const data = [
    {
      id: 1,
      imageUri:
        "https://plus.unsplash.com/premium_photo-1661347803954-499b607a36d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y2FyJTIwcmVudCUyMHdoaXRlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
      title: "Discover How It Works",
      description: "Make sure you understand how to rent a car through our app",
      link: "See more ",
    },
    {
      id: 2,
      imageUri:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Y2FyJTIwcmVudCUyMHdoaXRlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
      title: "Rent Out Your Car",
      description: "Learn how you can earn money by renting out your car",
      link: "See more ",
    },
    // Add more objects for additional cards
  ];

  return (
    <View className="justify-center h-full bg-white ">
      <View className="mx-4 mt-6">
        <ScrollView className=" bg-white  mt-[14px]   ">
          <TouchableOpacity
            onPress={() => navigation.navigate("Search", { email })}
          >
            <View className="flex-row justify-center p-4 mt-4 mb-4 bg-black rounded-md">
              <View className="justify-center py-2 "></View>
              <View className="">
                <Text className="font-bold text-white font-customs">
                  Book your dream car
                </Text>
                <View className="w-[120px] bg-white rounded-full px-4 py-2 mt-2 items-center">
                  <Text className="text-black font-customs ">Let's go</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Add a car", { email })}
          >
            <View className="p-4 bg-[#F2F2F2] rounded-md mb-4 mt-4 flex-row items-center">
              <Image
                source={require("./assets/g.png")}
                style={{ width: 120, height: 120, marginRight: 12 }}
              />
              <View className="">
                <Text className="font-bold text-black font-customs">
                  {email}
                </Text>
                <Text className="text-black font-customs ">Rent your car</Text>
                <View className="flex items-center mt-4 bg-[#000000] rounded-[12px] py-[10px]">
                  <Text className="px-4 text-sm text-white font-customs">
                    make money
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <View className="mt-4 mb-12 shadow-md">
            <View className="flex flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className="mb-4 text-lg font-bold font-customs">
                  Help center
                </Text>
              </View>
              <View className="items-end justify-end flex-1 mr-4">
                <TouchableOpacity
                  onPress={() => navigation.navigate("Help Center", { email })}
                >
                  <Text className="mb-4 text-sm font-bold text-gray-500 font-customs">
                    See more{" "}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={data}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => navigation.navigate("Help Center", { email })}
                >
                  <View className="h-auto p-4 mr-4 bg-white rounded-md shadow-md w-80 ">
                    <Image
                      source={{
                        uri: item.imageUri,
                      }}
                      className="w-full h-24 rounded-t-md "
                    />

                    <View className="p-4">
                      <Text className="mb-2 text-lg font-bold text-black font-customs">
                        {item.title}
                      </Text>
                      <Text className="text-black font-customs text-sms">
                        {item.description}
                      </Text>
                      
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const PlansScreen = ({ route }) => {
  return (
    <View className="h-full bg-white">
      <View className="items-center justify-center h-full mx-4">
        <Text className="text-2xl font-customs">
          We are not offering plans for now , you can write an email to:
          carrentallimitles@gmail.com
        </Text>
      </View>
    </View>
  );
};




const PresentationOne = ({ route }) => {
  const navigation = useNavigation();
  const { email } = route.params;
  const direct = () => {
    navigation.navigate("Home", { email });
  };
  const secondscreen = () => {
    navigation.navigate("Presentation-two", { email });
  };

  return (
    <ScrollView className="h-full bg-white">
      <View className="h-full bg-white">
        {/* Image with z-index: -10 */}
        <View className="z-[-10]">
          {/* Add negative margin to the top to cover the space */}
          <Image
            source={{
              uri: "https://cdn.dribbble.com/users/2654273/screenshots/20479476/media/7b8b842f8dee292c642da54378709f71.png?resize=640x480&vertical=center",
            }}
            style={{ width: "100%", height: 450, marginTop: -40 }}
          />
        </View>
        {/* Box with z-index: -20 */}
        <View className="rounded-t-[40px]  border-gray-600 shadow-3xl z-[-20] relative">
          <View className="w-full h-full bg-white rounded-t-40 relative z-[20]">
            <View className="items-start p-4 w-400px">
              <Text className="mt-4 text-gray-600 font-customs text-16">
                How to chat
              </Text>
              <Text className="font-customs text-28 mt-4 text-[27px]">
                We help you secure your informations and we allow you to chat
                with other users
              </Text>

              <View className="flex-row items-center justify-center mt-12 mb-4 ml-auto mr-auto space-x-4">
                <View className="w-4 h-2 bg-black rounded-full"></View>
                <View className="w-2 h-2 rounded-full bg-[#BEBFC4]"></View>
                <View className="w-2 h-2 rounded-full bg-[#BEBFC4]"></View>
              </View>

              <View className="flex-row items-center w-full mt-4">
                <TouchableOpacity
                  onPress={direct}
                  className="py-5 px-16 rounded-full bg-[#E3E3E3] my-6 mr-4"
                >
                  <Text className="text-black font-customs">Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={secondscreen}
                  className="px-16 py-5 my-6 bg-black rounded-full"
                >
                  <Text className="text-white font-customs">Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const PresentationTrois = ({ route }) => {
  const navigation = useNavigation();
  const { email, password, name, country } = route.params;

  const Homescreen = () => {
    navigation.navigate("Home", { email });
  };

  return (
    <ScrollView className="h-full bg-white">
      <View className="h-full bg-white ">
        <View className="z-10 ">
          <Image
            source={{
              uri: "https://cdn.dribbble.com/users/1811807/screenshots/16114634/media/22f12695bafc4d16b41bb427d634277f.png?resize=1600x1200&vertical=center",
            }}
            style={{ width: "100%", height: 450 }}
          />
        </View>

        <View className="w-full h-full bg-white rounded-t-[40px]  z-20 ">
          <View className="w-[400px] items-start p-4">
            <Text className="text-gray-600 mt-4 font-customs text-[16px]">
              Help Center
            </Text>
            <Text className="font-customs text-[28px] mt-4">
              You can contact us if you need more information
            </Text>

            <View className="flex-row items-center justify-center mt-12 mb-4 ml-auto mr-auto space-x-4">
              <View className="w-4 h-2 bg-black rounded-full"></View>
              <View className="w-2 h-2 bg-black rounded-full"></View>
              <View className="w-2 h-2 bg-black rounded-full"></View>
            </View>

            <View className="flex-row items-center w-full mt-4 d-flex">
              <TouchableOpacity
                onPress={Homescreen}
                className="px-16 py-5 my-6 bg-black rounded-full"
              >
                <Text className="text-white font-customs">Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const PresentationDeux = ({ route }) => {
  const navigation = useNavigation();
  const { email, password, name, country } = route.params;
  const direct = () => {
    navigation.navigate("Home", { email });
  };

  const thirdcreen = () => {
    navigation.navigate("Presentation-trois", { email });
  };

  return (
    <ScrollView className="h-full bg-white">
      <View className="h-full bg-white ">
        <View className="z-10 ">
          <Image
            source={{
              uri: "https://cdn.dribbble.com/userupload/2809453/file/original-ce78ea9d7c12e33f61c509effc832dc3.jpg?resize=1200x900",
            }}
            style={{ width: "100%", height: 450 }}
          />
        </View>

        <View className="w-full h-full bg-white rounded-t-[40px]  z-20 ">
          <View className="w-[400px] items-start p-4">
            <Text className="text-gray-600 mt-4 font-customs text-[16px]">
              Book and rent
            </Text>
            <Text className="font-customs text-[28px] mt-4">
              Make sure to enable all required settings
            </Text>

            <View className="flex-row items-center justify-center mt-12 mb-4 ml-auto mr-auto space-x-4">
              <View className="w-4 h-2 bg-black rounded-full"></View>
              <View className="w-2 h-2 bg-black rounded-full"></View>
              <View className="w-2 h-2 rounded-full bg-[#BEBFC4]"></View>
            </View>

            <View className="flex-row items-center w-full mt-4 d-flex">
              <TouchableOpacity
                onPress={direct}
                className="py-5 px-16 rounded-full bg-[#E3E3E3] my-6 mr-4"
              >
                <Text className="text-black font-customs">Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={thirdcreen}
                className="px-16 py-5 my-6 bg-black rounded-full"
              >
                <Text className="text-white font-customs">Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const Forget = ({ route }) => {
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const navigation = useNavigation();

  const handleKey = async () => {
    try {
      const userRef = dbFirebase.collection("users"); // Use dbFirebase directly
      const querySnapshot = await userRef
        .where("email", "==", email)
        .where("key", "==", key)
        .get();

      if (querySnapshot.empty) {
        // No matching user found in the "users" collection
        console.error("Authentication failed. User not found.");
        // Handle authentication error (e.g., show an error message to the user)
      } else {
        // Authentication successful; navigate to the next screen
        navigation.navigate("Home", { email }); // Change 'Home' to your desired screen
      }
    } catch (error) {
      console.error("Authentication failed", error.message);
      // Handle other authentication errors if needed
    }
  };

  return (
    <View className="justify-center h-full bg-black ">
      <View className="items-center justify-center ">
        <Image
          source={require("./assets/icon.png")}
          className="items-center w-16 h-16 mb-0"
        />
      </View>

      <View className="p-12">
        <View style={tw`items-start block mb-2`}>
          <Text
            className={"font-customs"}
            style={tw`text-sm font-medium text-white font-customs dark:text-white`}
          >
            Your Email
          </Text>
        </View>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
          style={tw`bg-black mb-4 border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
        ></TextInput>

        <View style={tw`block mb-2`}>
          <Text
            className={"font-customs"}
            style={tw`text-sm font-medium text-white font-customs dark:text-white`}
          >
            Your Key
          </Text>
        </View>

        <TextInput
          placeholder="key"
          value={key}
          onChangeText={(text) => setKey(text)}
          style={tw`bg-black mb-4 border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
        ></TextInput>

        <TouchableOpacity
          onPress={handleKey}
          className="bg-[#199FF0]"
          style={tw`w-full mt-4 items-center text-white  focus:ring-4 focus:outline-none focus:ring-blue-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center `}
        >
          <Text className="text-white font-customs">Let's go</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const userEmail = user.email; // Retrieve the user's email
        setEmail(userEmail);
        navigation.replace("Home", { email: userEmail });
      }
    });
    return () => unsubscribe();
  }, []);

  const handle = () => {
    navigation.navigate("SignUp");
  };

  const handletwo = () => {
    navigation.navigate("Forget");
  };

  const handleLogin = () => {
    setIsLoading(true);
    // Validate email and password
    if (!email || !password) {
      setErrorModalVisible(true);
      setIsLoading(false);
      return;
    }

    auth
      .signInWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        const { email, uid } = user;
        // Update the user's online status to "online" in Firestore
        await firestore.collection("users").doc(uid).update({ online: true });
        setEmail(email);
        navigation.replace("Home", { email });
      })
      .catch((error) => {
        console.log("Login error:", error);
        setErrorModalVisible(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <View style={tw`justify-center h-full bg-black dark:bg-gray-900`}>
      <View
        style={tw`flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0`}
      >
        <View
          style={tw`w-full bg-black rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-70`}
        >
          <View style={tw`p-6 space-y-4 md:space-y-6 sm:p-8`}>
            <View style={tw`space-y-4 md:space-y-6`}>
              <View style={tw`items-center`}>
                <Image
                  source={require("./assets/icon.png")}
                  className="w-16 h-16"
                />
              </View>
              <View style={tw`block mb-2`}>
                <Text
                  className={"font-customs"}
                  style={tw`text-sm font-medium text-white font-customs dark:text-white`}
                >
                  Your Email
                </Text>
              </View>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={(text) => setEmail(text)}
                style={tw`bg-black mb-4 border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
              ></TextInput>

              <View style={tw`block mt-4`}>
                <Text
                  className="font-customs"
                  style={tw`text-sm font-medium text-white dark:text-white`}
                >
                  Your Password
                </Text>
              </View>

              <TextInput
                placeholder="Password"
                value={password}
                secureTextEntry={true}
                onChangeText={(text) => setPassword(text)}
                style={tw`bg-black border border-gray-300 text-white mt-2 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
              ></TextInput>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              className="bg-[#199FF0]"
              style={tw`w-full mt-4 items-center text-white  focus:ring-4 focus:outline-none focus:ring-blue-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center `}
            >
              <Text className="text-white font-customs">Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handle}
              style={tw`w-full mt-4 items-center text-white bg-white hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center `}
            >
              <Text
                style={tw`text-black font-custom`}
                className="text-black font-customs"
              >
                {" "}
                Create an account
              </Text>
            </TouchableOpacity>

            <View style={tw`items-center justify-center pt-2`}>
              <Text style={tw`items-center justify-center text-white`}>Or</Text>
            </View>

            <TouchableOpacity
              onPress={handletwo}
              style={tw`w-full mt-4 items-center border-2 border-white text-white bg-black hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center `}
            >
              <Text className="text-white font-customs">
                {" "}
                Use your key to connect{" "}
              </Text>
            </TouchableOpacity>

            <View
              style={tw`w-full mt-12 items-center   text-white bg-black hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center `}
            >
              <Text className="text-white font-customs">
                {" "}
                © Limitlescar.com{" "}
              </Text>
            </View>

            <View style={tw`p-12 space-y-4 md:space-y-6 sm:p-8`}>
              <Modal visible={errorModalVisible} animationType="slide">
                <View style={tw`items-center justify-center flex-1 p-5`}>
                  <Text
                    className="font-custom"
                    style={tw`mb-4 text-xl font-semibold text-red-600`}
                  >
                    User not found. You need to check the internet connexion or
                    maybe your password or email is wrong
                  </Text>
                  <TouchableOpacity
                    style={tw`px-5 py-2 bg-black rounded-full hover:bg-blue-600`}
                    onPress={() => setErrorModalVisible(false)}
                  >
                    <Text
                      className="font-custom"
                      style={tw`text-sm font-medium text-white`}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const OrdersDetails = ({ route }) => {
  const { email } = route.params;
  const [ordersData, setOrdersData] = useState([]);
  const navigation = useNavigation();

  const backhome = () => {
    navigation.navigate("Home", { email }); // Navigate to the 'Faq' screen with the email parameter
  };

  useEffect(() => {
    const unsubscribe = firestore
      .collection("orders")
      .where("email", "==", email)
      .where("payment", "==", "validated")
      .onSnapshot((snapshot) => {
        const orders = snapshot.docs.map((doc) => doc.data());
        setOrdersData(orders);
      });

    return () => unsubscribe();
  }, [email]);

  const formatDate = (timestamp) => {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to JavaScript Date
    return date.toLocaleDateString(); // Format the date as needed
  };

  const printToPDF = async () => {
    // Build dynamic HTML content
    const dynamicHTML = `
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Document</title>
      </head>
      <body>
        <div class="flex-1 bg-white">
          
           
           
    
            <div>
    
                <div class="max-w-md p-6 mx-auto my-8 bg-white rounded-lg shadow-md">
                    <div class="flex-grow mt-24">
                        ${ordersData
                          .map(
                            (orderDetails, index) => `
                          <div class="p-4 mb-4 bg-white border border-gray-300 rounded-lg">
                            <div class="flex flex-row">
                              <Text class="mb-2 mr-4 text-2xl font-customs">
                                Your order the car from ${
                                  orderDetails.item.name
                                }
                              </Text>
                            </div>
                            <div class="text-base font-customs">
                              <Image src="${
                                orderDetails.item.profilePicture
                              }" style="height: 30px; width: 30px; border-radius: 50px;"></Image>
                              Don't forget you should pick up the car on ${formatDate(
                                orderDetails.selectedStartDate
                              )} 
                              and return it on ${formatDate(
                                orderDetails.selectedEndDate
                              )}. The place where you have to
                              pick up the car is ${
                                orderDetails.item.address
                              } in ${orderDetails.item.state}. You
                              can contact ${orderDetails.item.name} at ${
                              orderDetails.item.phoneNumber
                            }. If you
                              broke the car, you should contact ${
                                orderDetails.item.assuranceNumber
                              }.
                            </div>
                          </div>
                        `
                          )
                          .join("")}
                      </div>
                    <h1 class="mb-4 text-2xl font-semibold">Terms and Conditions</h1>
                
                    <p class="mb-4">
                        <span class="font-semibold">1. Responsibility for Damages</span><br>
                        When utilizing the Limitles app to rent a car, it is essential to understand that the person who rents the vehicle is solely responsible for any damage incurred during the rental period. This includes damages resulting from accidents, collisions, or any other unforeseen events. The renter must exercise care and caution when using the rented vehicle to prevent any potential damage.
                    </p>
                
                    <p class="mb-4">
                        <span class="font-semibold">2. Insurance Coverage</span><br>
                        Limitles is committed to ensuring the safety and well-being of both renters and car owners. As part of this commitment, Limitles provides insurance coverage to assist in covering damages. However, it is important to note that this coverage may not cover the full extent of damages. Therefore, all parties involved in the rental process - the app, the renter, and the car owner - are required to maintain their own insurance policies to cover any additional costs.
                    </p>
                
                    <p class="mb-4">
                        <span class="font-semibold">3. Engagement with Limitles</span><br>
                        When engaging with Limitles, all users, including those renting cars, acknowledge and accept their responsibility for potential damages that may occur while the vehicle is in their possession. The engagement with the Limitles platform signifies your understanding of these terms and your agreement to comply with them. This includes agreeing to cooperate with Limitles in the event of any insurance claims or damage assessments.
                    </p>
                
                    <p class="mb-4">
                        <span class="font-semibold">4. Cooperative Efforts</span><br>
                        In the event of damage to a rented vehicle, the renter should promptly report the incident to Limitles and the car owner. The renter, the car owner, and Limitles will collaborate to assess the extent of the damage and determine the necessary course of action. This cooperative effort is essential to ensure that the responsible party is identified and that insurance claims are processed smoothly.
                    </p>
                
                    <p>
                        <span class="font-semibold">5. Compliance with Local Laws</span><br>
                        Please note that the terms and conditions outlined here may be subject to local laws and regulations. It is your responsibility to be aware of and comply with any relevant laws in your area, as they may affect your obligations and rights as a user of the Limitles app. By using the Limitles platform, you agree to adhere to all applicable laws and regulations.
                    </p>
                </div>
                
            </div>
          </div>
      </body>
      </html>
      `;

    try {
      const pdfUrl = await Print.printAsync({
        html: dynamicHTML,
      });

      if (pdfUrl) {
        await Sharing.shareAsync(pdfUrl, {
          mimeType: "application/pdf",
          dialogTitle: "Share your order details",
        });
      }
    } catch (error) {
      console.error("Failed to create or share PDF: ", error);
    }
  };

  const contentRef = React.createRef();

  return (
    <View className="flex-1 bg-white" ref={contentRef}>
      <View className="w-full h-auto p-4 bg-gray-50">
        <View className="flex-row items-center justify-between mt-12 ">
          <TouchableOpacity
            onPress={() => navigation.navigate("Home", { email })}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold font-customs">My orders </Text>
          </View>

          <TouchableOpacity onPress={backhome}>
            <Ionicons name="car" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-grow mt-24">
        {ordersData.map((orderDetails, index) => (
          <View
            key={index}
            className="p-4 mb-4 bg-white border border-gray-300 rounded-lg"
          >
            <View className="flex flex-row">
              <Text className="mb-2 mr-4 text-2xl font-customs">
                Your order the car from {orderDetails.item.name}
              </Text>
            </View>
            <Text className="text-base font-customs">
              <Image
                source={{ uri: orderDetails.item.profilePicture }}
                style={{ height: 30, width: 30, borderRadius: 50 }}
              />
              Don't forget you should pick up the car on{" "}
              {formatDate(orderDetails.selectedStartDate)} and return it on{" "}
              {formatDate(orderDetails.selectedEndDate)}. The place where you
              have to pick up the car is {orderDetails.item.address} in{" "}
              {orderDetails.item.state}. You can contact{" "}
              {orderDetails.item.name} at {orderDetails.item.phoneNumber}. If
              you broke the car you should contact{" "}
              {orderDetails.item.assuranceNumber}.
            </Text>
            <TouchableOpacity
              className="items-center w-full py-4 mt-4 bg-[#33B978] rounded-[12px]"
              onPress={printToPDF}
            >
              <Text className="text-white font-customs">Get the PDF</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const SignUpScreen = ({ route }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [key, setKey] = useState("");
  const [country, setCountry] = useState(""); // State to hold the selected profile image
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false); // New state for loading spinner

  const handleSignup = async () => {
    setIsLoading(true);
    // Perform signup with email and password
    auth
      .createUserWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        // Signup successful
        const user = userCredential.user;
        const { uid, email } = user;

        // Add user data to Firestore collection
        await firestore.collection("users").doc(uid).set({
          email: email,
          online: false,
          password: password,
          name: name,
          key: key,
          phone: phone,
          country: country,
          profileImage:
            "https://images.unsplash.com/photo-1698486617171-d42ed85d75e1?auto=format&fit=crop&q=60&w=800&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw0fHx8ZW58MHx8fHx8",
        });

        // Navigate to HomeScreen and pass user parameters
        navigation.navigate("Presentation-one", {
          email: email,
          password: password,
          online: true,
          name: name,
          phone: phone,
          key: key,
          country: country,
        });
      })
      .catch((error) => {
        console.log("Signup error:", error);
      })
      .finally(() => {
        setIsLoading(false); // Hide loading spinner when signup process is done
      });
  };

  return (
    <ScrollView className="h-full bg-black">
      <View className="items-center justify-center flex-1 p-4 mt-32 bg-black d-flex">
        <TextInput
          placeholder="Email"
          value={email}
          placeholderTextColor="white"
          onChangeText={(text) => setEmail(text)}
          className="w-full h-10 px-2 mb-4 text-white border border-gray-300 rounded-md font-customs"
        />
        <Text className="mt-2 mb-4 text-white text-bold font-[12px] font-customs">
          Use 6 digits one number , letter and a special character
        </Text>
        <TextInput
          placeholder="Password"
          placeholderTextColor="white"
          value={password}
          onChangeText={(text) => setPassword(text)}
          secureTextEntry
          className="w-full h-10 px-2 mb-4 text-white border border-gray-300 rounded-md font-customs"
        />
        <TextInput
          placeholder="Name"
          placeholderTextColor="white"
          value={name}
          onChangeText={(text) => setName(text)}
          className="w-full h-10 px-2 mb-4 text-white border border-gray-300 rounded-md font-customs"
        />
        <TextInput
          placeholder="Country"
          placeholderTextColor="white"
          value={country}
          onChangeText={(text) => setCountry(text)}
          className="w-full h-10 px-2 mb-4 text-white border border-gray-300 rounded-md font-customs"
        />

        <TextInput
          placeholder="Mobile Phone number"
          placeholderTextColor="white"
          value={phone}
          onChangeText={(text) => setPhone(text)}
          className="w-full h-10 px-2 mb-4 text-white border border-gray-300 rounded-md font-customs"
        />

        <TextInput
          placeholder="Your key in case you forget your password"
          placeholderTextColor="white"
          value={key}
          onChangeText={(text) => setKey(text)}
          className="w-full h-10 px-2 mb-4 text-white border border-gray-300 rounded-md font-customs"
        />

        <TouchableOpacity
          className="w-full py-2 mb-4 bg-white rounded-full px-[120px] font-customs"
          onPress={handleSignup}
        >
          {isLoading ? ( // Show loading spinner when isLoading is true
            <ActivityIndicator color="black" />
          ) : (
            <Text className="font-bold text-center text-black font-customs">
              Sign up
            </Text>
          )}
        </TouchableOpacity>

        <Text
          className="font-custom"
          style={tw`mb-4 font-[12px] semibold text-gray-300 text-`}
        >
          By signing up, you acknowledge your acceptance of our terms and
          conditions. You can know more in limitlescar.com
        </Text>
      </View>
    </ScrollView>
  );
};

const Orderscars = ({ route }) => {
  const { email } = route.params;
  const [ordersData, setOrdersData] = useState([]);
  const navigation = useNavigation();

  const backhome = () => {
    navigation.navigate("Home", { email }); // Navigate to the 'Faq' screen with the email parameter
  };

  useEffect(() => {
    const unsubscribe = firestore
      .collection("orders")
      .where("item.myemail", "==", email)
      .where("payment", "==", "validated")
      .onSnapshot((snapshot) => {
        const orders = snapshot.docs.map((doc) => doc.data());
        setOrdersData(orders);
      });

    return () => unsubscribe(); // Cleanup the subscription when the component unmounts
  }, [email]);

  const formatDate = (timestamp) => {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to JavaScript Date
    return date.toLocaleDateString(); // Format the date as needed
  };

  return (
    <View className="flex-1 bg-white">
      <View className="w-full h-auto p-4 bg-gray-50">
        <View className="flex-row items-center justify-between mt-12 ">
          <TouchableOpacity
            onPress={() => navigation.navigate("Home", { email })}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold font-customs">Your Clients</Text>
          </View>

          <TouchableOpacity onPress={backhome}>
            <Ionicons name="car" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-grow mt-24">
        {ordersData.map((orderDetails, index) => (
          <View
            key={index}
            className="p-4 mb-4 bg-white border border-gray-300 rounded-lg"
          >
            <View className="flex flex-row">
              <Text className="mb-2 mr-4 text-2xl font-customs">
                Your have a order from {orderDetails.email}
              </Text>
            </View>
            <Text className="text-base font-customs">
              You should deliver the car{" "}
              {formatDate(orderDetails.selectedStartDate)} and return it on{" "}
              {formatDate(orderDetails.selectedEndDate)}. The place where you
              have to deliver the car is {orderDetails.item.address} in{" "}
              {orderDetails.item.state}. You can contact {orderDetails.fullName}{" "}
              at {orderDetails.mobileNumber}.
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Uberfont: require("./assets/fonts/UberMoveMedium.ttf"),
    Uberfontdeux: require("./assets/fonts/UberMoveMedium.ttf"),
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating loading time

    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (!fontsLoaded || isLoading) {
    return <ActivityIndicator size="large" color="black" />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          options={{ headerShown: false }}
          name="Login"
          component={LoginScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="SignUp"
          component={SignUpScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Details"
          component={DetailsScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Rent first"
          component={RentScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Rent Second"
          component={BookingSecondScreen}
        />

        <Stack.Screen
          options={{ headerShown: false }}
          name="Plans"
          component={PlansScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Payment Total Price"
          component={PaymentTotalPrice}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Payment final"
          component={Payment}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="AskkeyNowScreen"
          component={AskkeyNowScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Publishcar"
          component={PublishCarNow}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Before"
          component={BeforeCarNow}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Four Step add car"
          component={FourStepaddcar}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Third Step add car"
          component={ThirdStepaddcar}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Second Step add car"
          component={SecondStepaddcar}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Chatroom"
          component={ChatRoomScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Map"
          component={MapScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="My cars"
          component={MyCarsScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Settings"
          component={SettingsScreenDeux}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Account"
          component={AccountScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Help Center"
          component={HelpCenter}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="My orders"
          component={OrdersDetails}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Orderscars"
          component={Orderscars}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Presentation-one"
          component={PresentationOne}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Presentation-two"
          component={PresentationDeux}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Presentation-trois"
          component={PresentationTrois}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="CarAsk"
          component={CarAsk}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Forget"
          component={Forget}
        />

        <Stack.Screen
          name="Home"
          options={{ headerShown: false }}
          component={HomeScreen}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
