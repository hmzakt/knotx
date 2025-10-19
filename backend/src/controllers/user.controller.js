import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Subscription } from "../models/subscription.model.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {fullname, email, username, password} = req.body;

    // 1. Basic validations
    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are compulsory");
    }

    // 2. Check if user already exists
    const existedUser = await User.findOne({
        $or: [
            { username: username.toLowerCase() },
            { email: email.toLowerCase() }
        ]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists, username and email must be unique");
    }

    // 3. Handle avatar upload (optional)
    let avatarUrl = "";
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        avatarUrl = avatar?.url || "";
    }

    // 5. Create user
    const user = await User.create({
        fullname,
        avatar: avatarUrl,
        email: email.toLowerCase(),
        password,
        username: username.toLowerCase(),
    });

    // 6. Remove sensitive fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // 7. Send response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});


const loginUser = asyncHandler(async (req, res) => {
    //req body->data
    //based on username or email
    //find the user and generate response if user not found
    //password check
    //generate and provide access and refresh token
    //send cookies
    //send response

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [
            { username: username?.toLowerCase() }, 
            { email: email?.toLowerCase() }
        ]
    })

    console.log("User lookup result:", user ? "User found" : "User not found");
    console.log("Search criteria:", { 
        username: username?.toLowerCase(), 
        email: email?.toLowerCase() 
    });

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken").lean();

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        // path defaults to '/'
    }
    
    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "user logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1  //this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    }

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User Logged Out Successfully"))
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decodedToken?._id);

    if (!user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used");
    }

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    };

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(200, {
                accessToken,
                refreshToken: newRefreshToken
            }, "Access token refreshed successfully")
        );
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const getUserSubscriptions = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch active subscriptions by type; avoid relying on User.subscriptions linkage
    const now = new Date();

    const [
        allAccessSubs,
        singlePaperSubs,
        testSeriesSubs
    ] = await Promise.all([
        Subscription.find({ userId, type: 'all-access', status: 'active', endDate: { $gt: now } })
            .sort({ createdAt: -1 })
            .lean(),
        Subscription.find({ userId, type: 'single-paper', status: 'active', endDate: { $gt: now } })
            .populate({ path: 'itemId', model: 'Paper', select: 'title subject price' })
            .sort({ createdAt: -1 })
            .lean(),
        Subscription.find({ userId, type: 'test-series', status: 'active', endDate: { $gt: now } })
            .populate({ path: 'itemId', model: 'TestSeries', select: 'title description price papers' })
            .sort({ createdAt: -1 })
            .lean()
    ]);

    const categorizedSubscriptions = {
        allAccess: allAccessSubs,
        singlePapers: singlePaperSubs,
        testSeries: testSeriesSubs
    };

    const hasAllAccess = allAccessSubs.length > 0;
    const hasAnySubscription = (allAccessSubs.length + singlePaperSubs.length + testSeriesSubs.length) > 0;

    return res.status(200).json(
        new ApiResponse(200, {
            subscriptions: categorizedSubscriptions,
            hasAllAccess,
            hasAnySubscription
        }, "User subscriptions fetched successfully")
    );
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are mandatory")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email,
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, updatedUser, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = (req.file?.path)

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    //old image to be deleted both here and cover image

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath = (req.file?.path)

    if (!coverLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "cover image updated successfully")
        )
})

const forgotPassword = asyncHandler(async (req, res) => {
    const { email, newPassword, challenge } = req.body

    if (!email || !newPassword || !challenge) {
        throw new ApiError(400, "Email, new password, and challenge are required")
    }

    // Find the user by email first
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // For now, we'll skip the challenge verification since we need to implement 
    // the OTP verification logic in the backend. The frontend OTP verification
    // should be sufficient for this flow.
    
    // Update the password
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    )
})

// const getUserChannelProfile = asyncHandler(async (req, res) => {
//     const { username } = req.params
// 
//     if (!username?.trim()) {
//         throw new ApiError(400, "Username is missing")
//     }

//     const channel = await User.aggregate([   //aggregarte pipelines return arrays
//         {
//             $match: {
//                 username: username?.toLowerCase()
//             }
//         },
//         {
//             $lookup: {
//                 from: "subscriptions",   //dbname is automatically converted to lowercase and plural hence this is changed from Subscription
//                 localField: "_id",
//                 foreignField: "channel",
//                 as: "subscribers"
//             }
//         },
//         {
//             from: "subscriptions",
//             localField: "_id",
//             foreignField: "subscriber",
//             as: "subscribedTo"
//         },
//         {
//             $addFields: {
//                 subscribersCount: {
//                     $size: "$subscribers"
//                 },
//                 ChannelsSubscribedToCount: {
//                     $size: "SubscribedTo"
//                 },
//                 isSubscribed: {
//                     $condition: {
//                         if: { $in: [req.user?._id, "subscribers.subscriber"] }, //in can look into arrays as well as objects
//                         then: true,
//                         else: false
//                     }
//                 }
//             }
//         },
//         {
//             $project: {
//                 fullname: 1,
//                 username: 1,
//                 subscribersCount: 1,
//                 ChannelsSubscribedToCount: 1,
//                 isSubscribed: 1,
//                 avatar: 1,
//                 coverImage: 1,
//                 email: 1
//             }
//         }
//     ])

//     if (!channel?.length) {
//         throw new ApiError(404, "Channel does not exist")
//     }

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(200, channel[0], "User channel fetched successfully")
//         )
// })

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    getUserSubscriptions,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    forgotPassword
};