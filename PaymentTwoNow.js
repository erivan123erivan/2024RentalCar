import { useStripe } from "@stripe/stripe-react-native";
import React, { useState } from "react";
import { View, TextInput, Button, Alert, Text } from "react-native";
import { dbFirebase } from "./firebase";

const PaymentTwoNow = ({
  totalPrice,
  selectedStartDate,
  selectedEndDate,
  orderId,
}) => {
  const stripe = useStripe();
  const [name, setName] = useState("");

  const subscribe = async () => {
    if (name.trim() === "") {
      Alert.alert("Please enter your name.");
      return;
    }
    try {
      // Sending request
      const response = await fetch(
        "https://nodeservererivanstripe.onrender.com/transfer",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            totalPrice,
            selectedStartDate,
            selectedEndDate,
            orderId,
          }), // Pass additional data including orderId in the request body
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) return Alert.alert(data.message);
      const clientSecret = data.clientSecret;
      const initSheet = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Kainatv",
      });
      if (initSheet.error) return Alert.alert(initSheet.error.message);
      const presentSheet = await stripe.presentPaymentSheet({
        clientSecret,
      });
      if (presentSheet.error) return Alert.alert(presentSheet.error.message);

      // Payment successful, add 'payment: validated' field to the Firestore document
      await dbFirebase.collection("orders").doc(orderId).update({
        payment: "validated",
      });

      Alert.alert("Payment complete, thank you!");
    } catch (err) {
      console.error(err);
      Alert.alert("Something went wrong, try again later!");
    }
  };

  return (
    <View>
      <View className="items-center justify-center">
        <Text className="text-3xl font-bold font-custom">
          After insert the name wait feel seconds , don't Skip.
        </Text>
      </View>

      <TextInput
        value={name}
        onChangeText={(text) => setName(text)}
        placeholder="Name"
      />
      <Button
        className="px-4 py-4 bg-black"
        title={`Make the payment €${totalPrice}.00`}
        onPress={subscribe}
      />
    </View>
  );
};

export default PaymentTwoNow;
