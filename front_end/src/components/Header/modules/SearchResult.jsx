import React, { useEffect } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import { alpha, styled } from '@mui/material/styles'
import { Box, InputBase } from '@mui/material'
import useQuertConfig from '../../../hooks/useQuertConfig'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { searchSchema } from '../../../validation/product'
import { createSearchParams, useNavigate } from 'react-router-dom'
import { omit } from 'lodash'

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25)
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto'
    }
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '30ch'
        }
    }
}))

export default function SearchResult() {
    const navigate = useNavigate()
    const queryConfig = useQuertConfig()
    const { register, handleSubmit, setValue, watch } = useForm({
        defaultValues: {
            name: ''
        },
        resolver: yupResolver(searchSchema)
    })

    // Set the default value from the URL parameter when the component mounts
    useEffect(() => {
        setValue('name', queryConfig.name)
    }, [setValue])

    const handleSearch = handleSubmit((data) => {
        const config = queryConfig.order
            ? omit(
                {
                    ...queryConfig,
                    name: data.name
                },
                ['order', 'sort_by']
            )
            : omit({
                ...queryConfig,
                name: data.name
            })
        navigate({
            pathname: '/',
            search: createSearchParams(config).toString()
        })
    })

    // Watch for changes in the input and trigger search
    const searchValue = watch('name')
    useEffect(() => {
  if (searchValue !== undefined) {
    handleSubmit((data) => {
      const config = queryConfig.order
        ? omit(
            {
              ...queryConfig,
              name: data.name
            },
            ['order', 'sort_by']
          )
        : omit({
            ...queryConfig,
            name: data.name
          });
      navigate({
        pathname: '/',
        search: createSearchParams(config).toString()
      });
    })();
  }
}, [searchValue]);


    return (
        <Box component='form'>
            <Search style={{background: '#fff', color: '#000'}}>
                <SearchIconWrapper>
                    <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                    {...register('name')}
                    placeholder='Tìm kiếm...'
                    onChange={(e) => setValue('name', e.target.value)}                    
                />
            </Search>
        </Box>
    )
}
