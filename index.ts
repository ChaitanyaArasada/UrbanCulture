import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();
const firestore = admin.firestore();

// Constants for GST calculation
const GST_RATE = 0.18; // 18% GST
const IGST_RATE = 0.09; // 9% IGST
const CGST_RATE = 0.09; // 9% CGST

// Trigger for 'bookings' collection
export const processGSTInvoice = functions.firestore
  .document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Proceed only if the status changes to 'finished'
    if (beforeData?.status !== "finished" && afterData?.status === "finished") {
      const { name, totalBookingAmount } = afterData;

      // Calculate GST components
      const gstAmount = totalBookingAmount * GST_RATE;
      const igst = totalBookingAmount * IGST_RATE;
      const cgst = totalBookingAmount * CGST_RATE;

      // Log GST breakdown
      console.log(`Calculating GST for booking: ${context.params.bookingId}`);
      console.log(`Name: ${name}`);
      console.log(`Total Booking Amount: ${totalBookingAmount}`);
      console.log(`GST Amount: ${gstAmount}, IGST: ${igst}, CGST: ${cgst}`);

      // Call GST API for filing (mock integration)
      try {
        const response = await axios.post(
          "https://api.example.com/gst/filing", // Replace with actual API
          {
            name,
            totalBookingAmount,
            gstAmount,
            igst,
            cgst,
          },
          {
            headers: {
              Authorization: `Bearer YOUR_API_KEY`, // Replace with actual key
            },
          }
        );

        console.log("GST filing response:", response.data);

        // Update Firestore document with GST details
        await firestore
          .collection("bookings")
          .doc(context.params.bookingId)
          .update({
            gstFiled: true,
            gstDetails: { gstAmount, igst, cgst },
          });
      } catch (error) {
        console.error("Error in GST API integration:", error.message);
      }
    }
  });
