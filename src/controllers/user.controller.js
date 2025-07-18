import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadToCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";



const generateAccessAndRefreshTokens= async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefershToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access & refresh tokens")
    }
}

const registerUser = asyncHandler(async (req,res) =>{
    //get user details from frontend
    //validation-not empty
    //check if the user exists :username,email
    //check for image and avatar
    //upload them to cloudinary , avatar
    //create user object - create entry in DB
    //remove password ande refersh token field from response
    //check for user creation
    //if created return response


    const {fullName,username,email,password} = req.body
    console.log("email: " , email);
    
    if (
        [fullName,email,username,password].some((field)=>
        field?.trim()==="")
    ) {
        throw new ApiError(400,"all fields required")
    }
    const existedUser = await User.findOne({
        $or : [{username},{email}]
    }) 

    if (existedUser) {
        throw new ApiError(409, "User with email or username alredy exists")
    }
    // console.log(req.files);
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar is required")
    }

    const avatar = await uploadToCloudinary(avatarLocalPath)
    const coverImage = await uploadToCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400,"Avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )

})



const loginUser = asyncHandler(async (req , res ) => {
    //req body-> data
    // username or email
    // find the user 
    // password check 
    // access & refresh token 
    // send cookie 
    const {email ,username,password} = req.body
    
    if (!username || !email) {
        throw new ApiError(400 ,"Username OR email is required")
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!user) {
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401,"invalid password")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "user loggedin successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }            
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly:true,
        secure:true
    }
    return res 
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"))

})


export {registerUser,loginUser,logoutUser}