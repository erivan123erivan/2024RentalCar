import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { firestore } from "../../firebase";

const OrdersScreen = ({ route }) => {
  const { email } = route.params;
  const [ordersData, setOrdersData] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore
      .collection("orders")
      .where("car.myemail", "==", email)
      .where("payment", "==", "validated")
      .onSnapshot((snapshot) => {
        const orders = snapshot.docs.map((doc) => doc.data());
        setOrdersData(orders);
      });

    return () => unsubscribe(); // Cleanup the subscription when the component unmounts
  }, [email]);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
        style="flex-1 w-full bg-white mt-3"
      >
        {ordersData.map((order, index) => (
          <View key={index} style="w-full px-4 py-2 mb-4">
            <Text className="mb-4 text-xl font-customs">
              Client Information
            </Text>
            <Text className="text-sm font-customs">
              Full Name: {order.fullName}
            </Text>
            <Text className="text-sm font-customs">
              Mobile Number: {order.mobileNumber}
            </Text>
            <Text className="text-sm font-customs">
              Insurance: {order.insurance}
            </Text>
            <Text className="text-sm font-customs">
              Pickup Date: {order.pickupDate.toDate().toLocaleString()}
            </Text>
            <Text className="text-sm font-customs">
              Return Date: {order.returnDate.toDate().toLocaleString()}
            </Text>
            <View style="my-6 mt-12">
              {/* Display the driver license image */}
              <Image
                source={{ uri: order.driverLicenseUrl }}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 15,
                  marginTop: 12,
                }}
              />
            </View>

            <Text className="mt-4 mb-4 text-xl font-customs">The renter</Text>
            <Text className="text-sm font-customs">
              Insurance: {order.car.name}
            </Text>
            <Text className="text-sm font-customs">
              Phone number: {order.car.phoneNumber}
            </Text>
            <Text className="text-sm font-customs">
              Address: {order.car.address}
            </Text>
            <Text className="text-sm font-customs">
              Insurance name: {order.car.assuranceName}
            </Text>
            <Text className="text-sm font-customs">
              Insurance number: {order.car.assuranceNumber}
            </Text>
            <Text className="text-sm font-customs">
              Car Name: {order.car.carName}
            </Text>
            <Text className="text-sm font-customs">
              City: {order.car.city}, {order.car.country}
            </Text>
            <Text className="text-sm font-customs">
              KM used: {order.car.kilometersUsed}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default OrdersScreen;
